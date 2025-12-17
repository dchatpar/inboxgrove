#!/usr/bin/env lua
-- KumoMTA Dynamic Datasource Configuration
-- Enables real-time mailbox authentication via Redis lookup
-- This allows "infinite inboxes" - credentials are added to Redis without restarting KumoMTA

-- ========================================================================
-- REDIS CONNECTION SETUP
-- ========================================================================

local redis = require 'redis'

-- Connection pool for Redis
local redis_client = redis.connect({
    host = os.getenv('REDIS_HOST') or 'redis',
    port = os.getenv('REDIS_PORT') or 6379,
    socket_connect_timeout = 5000,
    socket_read_timeout = 10000,
    socket_write_timeout = 10000,
})

-- ========================================================================
-- AUTHENTICATION HANDLER
-- ========================================================================

-- Called by KumoMTA when client attempts SMTP authentication
function handle_mail_auth(domain, username, password)
    local redis_key = 'kumo:mailbox:' .. domain .. ':' .. username
    
    kumo.log('debug', 'AUTH attempt: ' .. username .. '@' .. domain)
    
    -- Query Redis for mailbox credentials
    local mailbox_data = redis_client:get(redis_key)
    
    if not mailbox_data then
        kumo.log('warn', 'AUTH FAILED: No mailbox found: ' .. redis_key)
        return false
    end
    
    -- Parse JSON mailbox data
    local mailbox = cjson.decode(mailbox_data)
    
    -- Verify password (bcrypt hash comparison via API callback)
    local verify_url = os.getenv('API_BASE_URL') .. '/api/v1/kumo/verify-password'
    
    local response = kumo.http.post(verify_url, cjson.encode({
        mailbox_id = mailbox.id,
        password = password,
        domain = domain,
        username = username
    }))
    
    if response.status ~= 200 then
        kumo.log('warn', 'AUTH FAILED: Password verification failed')
        return false
    end
    
    local result = cjson.decode(response.body)
    
    if result.valid then
        -- Update last login timestamp in Redis
        redis_client:hset(redis_key, 'last_auth', os.time())
        
        -- Check if mailbox is active
        if mailbox.status ~= 'active' and mailbox.status ~= 'warming' then
            kumo.log('warn', 'AUTH FAILED: Mailbox status is ' .. mailbox.status)
            return false
        end
        
        kumo.log('info', 'AUTH SUCCESS: ' .. username .. '@' .. domain)
        return true
    else
        kumo.log('warn', 'AUTH FAILED: Invalid password')
        return false
    end
end

-- ========================================================================
-- RATE LIMITING (Daily Sending Limit)
-- ========================================================================

function check_daily_limit(domain, username)
    local redis_key = 'kumo:mailbox:' .. domain .. ':' .. username
    local counter_key = 'kumo:sent_today:' .. domain .. ':' .. username
    
    local mailbox_data = redis_client:get(redis_key)
    if not mailbox_data then
        return false  -- Mailbox doesn't exist
    end
    
    local mailbox = cjson.decode(mailbox_data)
    local daily_limit = mailbox.daily_limit or 40
    
    -- Get today's sent count
    local today = os.date('%Y-%m-%d')
    local sent_today_key = counter_key .. ':' .. today
    local sent_count = tonumber(redis_client:get(sent_today_key) or 0)
    
    if sent_count >= daily_limit then
        kumo.log('warn', 'RATE LIMIT: Daily limit exceeded for ' .. username .. '@' .. domain)
        return false
    end
    
    return true
end

function increment_daily_counter(domain, username)
    local counter_key = 'kumo:sent_today:' .. domain .. ':' .. username
    local today = os.date('%Y-%m-%d')
    local sent_today_key = counter_key .. ':' .. today
    
    -- Increment counter and set expiry to next day
    redis_client:incr(sent_today_key)
    redis_client:expire(sent_today_key, 86400)  -- 24 hours
end

-- ========================================================================
-- REPUTATION MONITORING
-- ========================================================================

function update_health_score(domain, username, delivery_status)
    local redis_key = 'kumo:mailbox:' .. domain .. ':' .. username
    local health_key = redis_key .. ':health'
    
    -- Fetch current health score
    local health_data = redis_client:hgetall(health_key)
    local health_score = tonumber(health_data.score or 100)
    
    -- Adjust based on delivery status
    if delivery_status == 'delivered' then
        health_score = math.min(100, health_score + 0.5)
    elseif delivery_status == 'bounced' then
        health_score = math.max(0, health_score - 2)
    elseif delivery_status == 'complained' then
        health_score = math.max(0, health_score - 5)
    end
    
    -- Update Redis
    redis_client:hset(health_key, 'score', health_score)
    redis_client:hset(health_key, 'updated_at', os.time())
    
    -- If score drops below 75%, pause the mailbox
    if health_score < 75 then
        redis_client:hset(redis_key, 'status', 'paused')
        kumo.log('warn', 'MAILBOX PAUSED: Health score too low: ' .. username .. '@' .. domain)
    end
end

-- ========================================================================
-- QUEUE DECLARATION
-- ========================================================================

-- Define queues by domain for isolation
local queue_configs = {
    {
        name = 'default',
        max_age = '10 minutes',
        max_retry_duration = '2 days',
        retry_schedule = {
            '1m',
            '5m',
            '10m',
            '30m',
            '1h',
            '3h',
            '6h',
            '24h',
        },
    },
    {
        name = 'warmup',
        max_age = '1 day',
        max_retry_duration = '1 day',
        retry_schedule = {
            '1m',
            '5m',
            '30m',
            '2h',
        },
    }
}

for _, config in ipairs(queue_configs) do
    kumo.define_queue(config)
end

-- ========================================================================
-- LISTENER CONFIGURATION (SMTP + Submission)
-- ========================================================================

-- Port 25: SMTP (from other MTAs)
kumo.define_listener({
    listen = '0.0.0.0:25',
    relay_hosts = {},  -- No relaying from external
})

-- Port 587: Submission (from clients with AUTH)
kumo.define_listener({
    listen = '0.0.0.0:587',
    require_tls = 'Opportunistic',
    auth = {
        mechanisms = { 'LOGIN', 'PLAIN' },
        validate = handle_mail_auth,
    },
})

-- Port 993: IMAPS (for mailbox polling)
kumo.define_listener({
    listen = '0.0.0.0:993',
    protocol = 'IMAP',
    require_tls = 'Required',
    auth = {
        mechanisms = { 'LOGIN', 'PLAIN' },
        validate = handle_mail_auth,
    },
})

-- Port 8008: KumoMTA Admin API
kumo.define_listener({
    listen = '0.0.0.0:8008',
    protocol = 'HTTP',
    trusted_networks = { '10.0.0.0/8', '127.0.0.1' },
})

-- ========================================================================
-- TLS CONFIGURATION
-- ========================================================================

kumo.configure_tls({
    certificate_chain = '/etc/kumomta/tls/cert.pem',
    private_key = '/etc/kumomta/tls/key.pem',
})

-- ========================================================================
-- TRAFFIC SHAPING (Sending Limits)
-- ========================================================================

-- Per-domain rate limiting
kumo.set_traffic_shape_name('default')
kumo.set_traffic_shape_rules({
    outbound = {
        max_connections = 100,
        connection_rate = '10/sec',
    }
})

-- ========================================================================
-- BOUNCE AND FEEDBACK PROCESSING
-- ========================================================================

function handle_bounce(bounce_data)
    local domain = bounce_data.domain
    local username = bounce_data.user
    
    -- Log bounce
    kumo.log('warn', 'BOUNCE: ' .. bounce_data.diagnostic_code .. ' for ' .. username .. '@' .. domain)
    
    -- Update health score
    update_health_score(domain, username, 'bounced')
    
    -- Store bounce details for analysis
    local bounce_key = 'kumo:bounces:' .. domain .. ':' .. username
    redis_client:lpush(bounce_key, cjson.encode(bounce_data))
    redis_client:ltrim(bounce_key, 0, 99)  -- Keep last 100 bounces
end

function handle_delivery_status(delivery_data)
    local domain = delivery_data.domain
    local username = delivery_data.user
    
    if delivery_data.status == 'delivered' then
        update_health_score(domain, username, 'delivered')
    elseif delivery_data.status == 'failed' then
        update_health_score(domain, username, 'bounced')
    end
end

-- ========================================================================
-- HOT RELOADING FOR NEW MAILBOXES
-- ========================================================================

-- Called periodically to reload datasource
function refresh_mailbox_cache()
    -- Get all mailboxes from Redis
    local pattern = 'kumo:mailbox:*'
    local keys = redis_client:keys(pattern)
    
    kumo.log('info', 'Refreshing mailbox cache: ' .. #keys .. ' mailboxes active')
    
    for _, key in ipairs(keys) do
        local mailbox_data = redis_client:get(key)
        if mailbox_data then
            local mailbox = cjson.decode(mailbox_data)
            
            -- Skip inactive mailboxes
            if mailbox.status == 'active' or mailbox.status == 'warming' then
                -- Mailbox is ready to use
            end
        end
    end
end

-- Schedule cache refresh every 60 seconds
kumo.on_interval('60 seconds', refresh_mailbox_cache)

-- ========================================================================
-- LOGGING & METRICS
-- ========================================================================

kumo.metrics.register({
    name = 'mailbox_auth_success',
    type = 'counter',
})

kumo.metrics.register({
    name = 'mailbox_auth_failure',
    type = 'counter',
})

kumo.metrics.register({
    name = 'daily_limit_exceeded',
    type = 'counter',
})

kumo.on_mail_auth_success(function()
    kumo.metrics.increment('mailbox_auth_success')
end)

kumo.on_mail_auth_failure(function()
    kumo.metrics.increment('mailbox_auth_failure')
end)

-- ========================================================================
-- SHUTDOWN HANDLER
-- ========================================================================

kumo.on_shutdown(function()
    redis_client:close()
    kumo.log('info', 'KumoMTA shut down cleanly')
end)

kumo.log('info', 'KumoMTA configuration loaded with Redis datasource')
