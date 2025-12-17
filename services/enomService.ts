// eNom/Enom Reseller (resellertest) domain purchase service
// Provided creds: url, uid, api key, password

export interface EnomCredentials {
  url: string; // e.g., https://resellertest.enom.com
  uid: string; // apexbyteinc
  apiKey: string; // 67BMECH5AA7PUFQQUMLVZELETWA32DCBRQGOEIQF
  password: string; // provided by user
}

export interface DomainPurchaseResult {
  ok: boolean;
  message: string;
  orderId?: string;
  domain?: string;
  raw?: any;
}

const qs = (params: Record<string, string>) =>
  Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

export class EnomService {
  static async checkAvailability(creds: EnomCredentials, domain: string): Promise<any> {
    const url = `${creds.url}/interface.asp?${qs({
      command: 'check',
      uid: creds.uid,
      pw: creds.password,
      sld: domain.split('.')[0],
      tld: domain.split('.').slice(1).join('.'),
      Responsetype: 'JSON',
    })}`;
    const res = await fetch(url);
    return res.json();
  }

  static async purchaseDomain(creds: EnomCredentials, domain: string, years = '1'): Promise<DomainPurchaseResult> {
    const [sld, ...tldParts] = domain.split('.');
    const tld = tldParts.join('.');
    const url = `${creds.url}/interface.asp?${qs({
      command: 'purchase',
      uid: creds.uid,
      pw: creds.password,
      sld,
      tld,
      NumYears: years,
      Responsetype: 'JSON',
    })}`;
    const res = await fetch(url);
    const data = await res.json();
    const success = !!data?.interface?.response?.OrderID;
    return {
      ok: success,
      message: success ? 'Domain purchased successfully' : (data?.interface?.responsedescription || 'Purchase failed'),
      orderId: data?.interface?.response?.OrderID,
      domain,
      raw: data,
    };
  }
}

export default EnomService;