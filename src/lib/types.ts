import type { User } from 'better-auth'

export interface NavbarProps {
  items: {
    label: string
    to: string
    activeOptions: { exact: boolean }
    isDropdown?: boolean
  }
}

export interface NavbarUserProps {
  user: User
}
