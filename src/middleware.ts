export { default } from 'next-auth/middleware'

export const config = {
  matcher: ['/dashboard/:path*', '/api/products/:path*', '/api/orders/:path*', '/api/tasks/:path*'],
}
