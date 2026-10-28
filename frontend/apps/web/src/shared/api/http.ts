const EMPTY_BODY_STATUSES = [204, 205, 304];

function getRequestUrl(url: string) {
  if (typeof window !== "undefined") {
    return url;
  }

  const apiBaseUrl = process.env.API_BASE_URL;

  if (!apiBaseUrl) {
    throw new Error("API_BASE_URL 환경 변수가 설정되지 않았습니다.");
  }

  return `${apiBaseUrl}${url}`;
}

async function getBody(response: Response): Promise<unknown> {
  if (EMPTY_BODY_STATUSES.includes(response.status) || !response.body) {
    return {};
  }

  return response.json();
}

export async function http<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(getRequestUrl(url), init);
  const data = await getBody(response);

  return { data, status: response.status, headers: response.headers } as T;
}
