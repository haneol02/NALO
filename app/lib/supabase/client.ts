import { createBrowserClient } from '@supabase/ssr'

let cachedClient: any = null

export function createClient() {
  // 이미 생성된 클라이언트가 있으면 반환
  if (cachedClient) {
    return cachedClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase 환경 변수가 설정되지 않았습니다.')
    // 더미 클라이언트 반환
    cachedClient = {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signOut: () => Promise.resolve({ error: null }),
        signInWithOAuth: () => Promise.resolve({ data: null, error: null })
      }
    } as any
    return cachedClient
  }

  try {
    // 실제 Supabase 클라이언트 생성
    cachedClient = createBrowserClient(supabaseUrl, supabaseAnonKey)
    return cachedClient
  } catch (error) {
    console.error('Supabase 클라이언트 생성 실패:', error)
    // 에러 발생 시 더미 클라이언트 반환
    cachedClient = {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signOut: () => Promise.resolve({ error: null }),
        signInWithOAuth: () => Promise.resolve({ data: null, error: null })
      }
    } as any
    return cachedClient
  }
}