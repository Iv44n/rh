import {
  BookOpenIcon,
  BotIcon,
  Settings2Icon,
  TerminalSquareIcon
} from 'lucide-react'
import type * as React from 'react'
import { NavMain } from '#/features/dashboard/components/nav-main'
import { NavOrganization } from '#/features/dashboard/components/nav-organization'
import { NavUser } from '#/features/dashboard/components/nav-user'
import { TeamSwitcher } from '#/features/dashboard/components/team-switcher'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail
} from '#/shared/components/ui/sidebar.tsx'

const data = {
  navMain: [
    {
      title: 'Playground',
      url: '#',
      icon: <TerminalSquareIcon />,
      isActive: true,
      items: [
        {
          title: 'History',
          url: '#'
        },
        {
          title: 'Starred',
          url: '#'
        },
        {
          title: 'Settings',
          url: '#'
        }
      ]
    },
    {
      title: 'Models',
      url: '#',
      icon: <BotIcon />,
      items: [
        {
          title: 'Genesis',
          url: '#'
        },
        {
          title: 'Explorer',
          url: '#'
        },
        {
          title: 'Quantum',
          url: '#'
        }
      ]
    },
    {
      title: 'Documentation',
      url: '#',
      icon: <BookOpenIcon />,
      items: [
        {
          title: 'Introduction',
          url: '#'
        },
        {
          title: 'Get Started',
          url: '#'
        },
        {
          title: 'Tutorials',
          url: '#'
        },
        {
          title: 'Changelog',
          url: '#'
        }
      ]
    },
    {
      title: 'Settings',
      url: '#',
      icon: <Settings2Icon />,
      items: [
        {
          title: 'General',
          url: '#'
        },
        {
          title: 'Team',
          url: '#'
        },
        {
          title: 'Billing',
          url: '#'
        },
        {
          title: 'Limits',
          url: '#'
        }
      ]
    }
  ]
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavOrganization />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
