'use client';
import { useState, type ReactNode } from 'react';
import { BrandLockup } from './BrandLockup';
import { Link,usePathname } from '@/lib/navigation';
import { useApp } from '@/context/AppContext';
import { usePipeline } from '@/context/PipelineContext';
import { Icon,type IconName } from './Icon';
import { SidebarProvider,Sidebar,SidebarHeader,SidebarContent,SidebarGroup,SidebarGroupLabel,SidebarMenu,SidebarMenuItem,SidebarMenuButton,SidebarFooter,SidebarTrigger,SidebarInset,useSidebar } from '@/components/ui/sidebar';
import { DropdownMenu,DropdownMenuContent,DropdownMenuItem,DropdownMenuLabel,DropdownMenuSeparator,DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { NewRunModal } from './modals/NewRunModal';
import { CreateOrgModal } from './modals/CreateOrgModal';
import { CreateWorkspaceModal } from './modals/CreateWorkspaceModal';
import { InviteMemberModal } from './modals/InviteMemberModal';

type ShellProps={children:ReactNode;crumb:string;middleCrumb?:ReactNode;badge?:ReactNode;actions?:ReactNode};
const primaryLinks:{to:string;label:string;icon:IconName}[]=[{to:'/dashboard',label:'Project home',icon:'grid'},{to:'/jobs',label:'Jobs',icon:'clock'}];
const toolLinks:{to:string;label:string;icon:IconName}[]=[{to:'/analysis',label:'Analysis',icon:'search'},{to:'/design',label:'Design',icon:'flow'},{to:'/develop',label:'Develop',icon:'code'},{to:'/job-analytics',label:'Job dashboard',icon:'chart'}];
const organizationLinks:{to:string;label:string;icon:IconName}[]=[{to:'/organization-dashboard',label:'Org dashboard',icon:'grid'},{to:'/projects',label:'Projects',icon:'folder'},{to:'/rbac',label:'Members & roles',icon:'users'},{to:'/connectors',label:'Connectors',icon:'plug'},{to:'/audit-log',label:'Audit log',icon:'scroll'},{to:'/settings',label:'Settings',icon:'gear'}];
export function AppShell(props:ShellProps){return <SidebarProvider><ShellBody {...props}/></SidebarProvider>;}
function ShellBody({children,crumb,middleCrumb,badge,actions}:ShellProps){
  const pathname=usePathname();
  const {setOpenMobile}=useSidebar();
  const {organizations,currentOrg,membersForCurrentOrg,switchOrg,currentWorkspace,workspacesForCurrentOrg,switchWorkspace,setIsNewOrgOpen,setIsNewWsOpen,openNewRun}=useApp();
  const {runs}=usePipeline();
  const organizationPage=['/organization-dashboard','/projects','/rbac','/connectors','/audit-log','/settings'].includes(pathname);
  const [toolsDisclosure,setToolsDisclosure]=useState({pathname,open:toolLinks.some(item=>item.to===pathname)});
  const [organizationDisclosure,setOrganizationDisclosure]=useState({pathname,open:organizationPage});
  const demoUser=membersForCurrentOrg.find(member=>member.status==='active'&&member.role==='Admin')??membersForCurrentOrg[0];
  const active=runs.filter(r=>r.status==='running'||r.status==='queued').length;
  const toolsOpen=toolsDisclosure.pathname===pathname?toolsDisclosure.open:toolLinks.some(item=>item.to===pathname);
  const organizationOpen=organizationDisclosure.pathname===pathname?organizationDisclosure.open:organizationPage;
  const closeMobile=()=>setOpenMobile(false);
  const renderLink=(item:{to:string;label:string;icon:IconName})=>{const selected=pathname===item.to||(pathname==='/'&&item.to==='/dashboard');return <SidebarMenuItem key={item.to}><SidebarMenuButton asChild isActive={selected} className="h-10 rounded-lg px-3" tooltip={item.label}><Link to={item.to} onClick={closeMobile} className="gap-3"><Icon name={item.icon} className="size-4"/><span className="flex-1">{item.label}</span>{item.to==='/jobs'&&active>0&&<span className="rounded-md bg-white/10 px-1.5 text-[10px]">{active}</span>}</Link></SidebarMenuButton></SidebarMenuItem>;};
  return <div className="flex min-h-screen w-full bg-background" data-od-id="app-shell">
    <Sidebar className="app-navigation border-r border-border" data-od-id="sidebar">
      <SidebarHeader className="gap-4 p-4">
        <Link to="/dashboard" className="flex items-center gap-3 py-2" onClick={closeMobile}>
          <BrandLockup inverse />
        </Link>
        <DropdownMenu><DropdownMenuTrigger asChild><button type="button" className="flex w-full items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 p-3 text-left" data-od-id="org-switcher">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/10 text-xs font-semibold text-white">{currentOrg.name.slice(0,2).toUpperCase()}</span>
          <span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-white">{currentOrg.name}</span><span className="block text-[11px] text-white/50">Organization · {currentOrg.memberCount} members</span></span><Icon name="chev" className="size-3.5 text-white/50"/>
        </button></DropdownMenuTrigger><DropdownMenuContent align="start" className="w-64"><DropdownMenuLabel>Organizations</DropdownMenuLabel>{organizations.map(org=><DropdownMenuItem key={org.id} onClick={()=>switchOrg(org.id)} className="gap-2"><span className="flex-1 truncate">{org.name}</span>{currentOrg.id===org.id&&<Icon name="check" className="size-4 text-accent-strong"/>}</DropdownMenuItem>)}<DropdownMenuSeparator/><DropdownMenuItem onClick={()=>{closeMobile();setIsNewOrgOpen(true);}}><Icon name="plus" className="size-4"/>Create organization</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
        <DropdownMenu><DropdownMenuTrigger asChild><button type="button" className="flex w-full items-center gap-2 px-1 py-1 text-left text-xs text-white/80" data-od-id="project-switcher"><Icon name="folder" className="size-4 text-white/50"/><span className="min-w-0 flex-1 truncate">{currentWorkspace.name}</span><Icon name="chev" className="size-3.5 text-white/50"/></button></DropdownMenuTrigger><DropdownMenuContent align="start" className="w-64"><DropdownMenuLabel>Projects</DropdownMenuLabel>{workspacesForCurrentOrg.map(ws=><DropdownMenuItem key={ws.id} onClick={()=>switchWorkspace(ws.id)}><span className="flex-1 truncate">{ws.name}</span>{ws.id===currentWorkspace.id&&<Icon name="check" className="size-4 text-accent-strong"/>}</DropdownMenuItem>)}<DropdownMenuSeparator/><DropdownMenuItem onClick={()=>{closeMobile();setIsNewWsOpen(true);}}><Icon name="plus" className="size-4"/>Create project</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
        <Button variant="accent" className="h-10 w-full justify-center gap-2" onClick={()=>{closeMobile();openNewRun();}}><Icon name="play" className="size-4"/>Start pipeline</Button>
      </SidebarHeader>
      <SidebarContent className="px-3 pb-3">
        <SidebarGroup className="p-0 pt-3"><SidebarGroupLabel className="h-7 px-3 text-[10px] font-semibold uppercase tracking-[.13em] text-white/40">Project</SidebarGroupLabel><SidebarMenu>{primaryLinks.map(renderLink)}</SidebarMenu></SidebarGroup>
        <SidebarGroup className="p-0 pt-3"><details open={toolsOpen} onToggle={event=>setToolsDisclosure({pathname,open:event.currentTarget.open})}><summary className="flex h-8 cursor-pointer list-none items-center justify-between rounded-md px-3 text-[10px] font-semibold uppercase tracking-[.13em] text-white/40 hover:text-white/70"><span>Explore tools</span><Icon name="chev" className={`size-3 transition-transform ${toolsOpen?'rotate-180':''}`}/></summary><SidebarMenu className="mt-1">{toolLinks.map(renderLink)}</SidebarMenu></details></SidebarGroup>
        <SidebarGroup className="p-0 pt-3"><details open={organizationOpen} onToggle={event=>setOrganizationDisclosure({pathname,open:event.currentTarget.open})}><summary className="flex h-8 cursor-pointer list-none items-center justify-between rounded-md px-3 text-[10px] font-semibold uppercase tracking-[.13em] text-white/40 hover:text-white/70"><span>Organization</span><Icon name="chev" className={`size-3 transition-transform ${organizationOpen?'rotate-180':''}`}/></summary><SidebarMenu className="mt-1">{organizationLinks.map(renderLink)}</SidebarMenu></details></SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-white/10 p-4"><div className="flex items-center gap-2.5"><span className="grid size-8 place-items-center rounded-full bg-accent-soft text-xs font-semibold text-accent-strong">{demoUser?.initials??'U'}</span><span className="min-w-0 flex-1"><span className="block text-xs font-medium text-white">{demoUser?.name??'Demo user'}</span><span className="block text-[11px] text-white/45">{currentOrg.role} · Demo access</span></span><Link to="/login" aria-label="Open login" title="Open login" className="grid size-8 place-items-center rounded-lg text-white/60 hover:bg-white/10"><Icon name="out" className="size-4"/></Link></div></SidebarFooter>
    </Sidebar>
    <SidebarInset className="min-w-0 flex-1 bg-background">
      <header className="sticky top-0 z-20 flex min-h-16 items-center gap-3 border-b border-border bg-surface/95 px-4 backdrop-blur sm:px-7" data-od-id="topbar">
        <SidebarTrigger className="text-muted"/>
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-xs text-muted"><span className="hidden truncate md:block">{currentOrg.name}</span><span className="hidden md:block">/</span>{!organizationPage&&<><span className="hidden max-w-[160px] truncate lg:block">{currentWorkspace.name}</span><span className="hidden lg:block">/</span></>}{middleCrumb&&<span className="hidden md:block">{middleCrumb}</span>}<span className="truncate font-medium text-foreground">{crumb}</span></nav>
        <div className="flex-1"/><div className="hidden items-center gap-1.5 rounded-full border border-border bg-surface-inset px-2.5 py-1 text-[10px] font-medium text-muted sm:flex"><span className="size-1.5 rounded-full bg-accent-strong"/>{organizationPage?'Demo organization':'Demo project'}</div>{actions}{badge}<Button variant="outline" size="icon" className="md:hidden" aria-label="New job" onClick={()=>openNewRun()}><Icon name="plus" className="size-4"/></Button>
      </header>
      {children}
    </SidebarInset>
    <NewRunModal/><CreateOrgModal/><CreateWorkspaceModal/><InviteMemberModal/>
  </div>;
}
