import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <div className="grid gap-2">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <Link to="/" className="text-primary hover:underline">
        Back to overview
      </Link>
    </div>
  )
}
