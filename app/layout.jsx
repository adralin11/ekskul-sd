import './globals.css'

export const metadata = {
  title: 'EkskulSD - Sistem Informasi Ekstrakurikuler',
  description: 'Platform pengelolaan ekstrakurikuler Sekolah Dasar',
}

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  )
}
