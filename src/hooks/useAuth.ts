import { useNavigate } from '@tanstack/react-router'
import { clearCredentials } from '#/lib/auth'
import { queryClient } from '#/lib/queryClient'

export function useAuth() {
  const navigate = useNavigate()

  function logout() {
    clearCredentials()
    queryClient.invalidateQueries()
    navigate({ to: '/login' })
  }

  return { logout }
}
