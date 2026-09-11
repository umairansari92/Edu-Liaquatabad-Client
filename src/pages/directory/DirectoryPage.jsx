import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  Users, GraduationCap, Heart, Search, RefreshCw, Download,
  Building2, BookOpen, Phone, Mail, Hash, IdCard, UserCircle, CalendarDays,
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../services/apiClient.js';
import PageContainer from '../../components/layout/PageContainer.jsx';

const STATUS_COLORS = {
  ACTIVE:           'bg-emerald-950/80 text-emerald-400 border-emerald-700/50',
  PENDING_APPROVAL: 'bg-amber-950/80 text-amber-300 border-amber-700/50',
  SUSPENDED:        'bg-red-950/80 text-red-400 border-red-700/50',
  TRANSFERRED:      'bg-blue-950/80 text-blue-400 border-blue-700/50',
  GRADUATED:        'bg-purple-950/80 text-purple-400 border-purple-700/50',
  INACTIVE:         'bg-slate-800 text-slate-500 border-slate-700',
};
const statusBadge = (s) => (
  <span className={`rounded border px-2 py-0.5 text-[10px] font-bold ${STATUS_COLORS[s] || STATUS_COLORS.INACTIVE}`}>
    {(s || 'UNKNOWN').replace(/_/g, ' ')}
  </span>
);
const roleBadge = (role) => {
  const map = {
    ROOT_ADMIN:'bg-red-950 text-red-400 border-red-800',
    SUPER_ADMIN:'bg-amber-950 text-amber-300 border-amber-800',
    ADMIN:'bg-emerald-950 text-emerald-300 border-emerald-800',
    HM:'bg-blue-950 text-blue-300 border-blue-800',
    SUPERVISOR:'bg-violet-950 text-violet-300 border-violet-800',
    TEACHER:'bg-cyan-950 text-cyan-300 border-cyan-800',
    PEON:'bg-slate-800 text-slate-400 border-slate-700',
  };
  return <span className={`rounded border px-2 py-0.5 text-[10px] font-bold font-mono ${map[role]||map.PEON}`}>{role}</span>;
};
const fmt = (d) => d ? new Date(d).toISOString().slice(0,10) : 'UNKNOWN';
const Td = ({ children, className='' }) => <td className={`px-4 py-3.5 ${className}`}>{children}</td>;
const LoadingRow = ({ cols }) => (
  <tr><td colSpan={cols} className="py-14 text-center">
    <RefreshCw className="mx-auto h-6 w-6 animate-spin text-emerald-400 mb-2"/>
    <p className="text-sm text-slate-400">Loading records...</p>
  </td></tr>
);
const EmptyRow = ({ cols }) => (
  <tr><td colSpan={cols} className="py-14 text-center">
    <UserCircle className="mx-auto h-10 w-10 text-slate-700 mb-2"/>
    <p className="text-sm font-semibold text-slate-400">No records found</p>
    <p className="text-xs text-slate-600 mt-1">Try adjusting filters or search.</p>
  </td></tr>
);

const downloadCsv = async (endpoint, filename, params, setExp) => {
  setExp(true);
  try {
    const qs = new URLSearchParams(params).toString();
    const res = await apiClient.get(`${endpoint}${qs?'?'+qs:''}`, { responseType: 'blob' });
    const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
    toast.success(`${filename} downloaded.`);
  } catch { toast.error('Export failed. Check permissions.'); }
  finally { setExp(false); }
};

const SI = ({ value, onChange, placeholder, focus }) => (
  <div className="relative flex-1 min-w-[180px] max-w-xs">
    <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500"/>
    <input type="text" value={value} onChange={(e)=>onChange(e.target.value)} placeholder={placeholder}
      className={`w-full rounded-lg border border-slate-700 bg-slate-800/90 py-1.5 pl-8 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none ${focus}`}/>
  </div>
);
const SF = ({ value, onChange, focus, children }) => (
  <select value={value} onChange={(e)=>onChange(e.target.value)}
    className={`rounded-lg border border-slate-700 bg-slate-800/90 px-3 py-1.5 text-xs text-slate-200 focus:outline-none ${focus}`}>
    {children}
  </select>
);
const FB = ({ children, count, label, onR, loading, onExp, exporting, btnCls }) => (
  <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between rounded-xl border border-slate-800 bg-slate-900/70 p-3">
    <div className="flex flex-wrap gap-2 flex-1">{children}</div>
    <div className="flex items-center gap-2 shrink-0">
      <span className="text-xs text-slate-400 font-mono whitespace-nowrap"><span className="text-white font-bold">{count}</span> {label}</span>
      <button onClick={onR} className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-300 hover:bg-slate-700 transition">
        <RefreshCw className={`h-3.5 w-3.5 ${loading?'animate-spin':''}`}/>
      </button>
      <button onClick={onExp} disabled={exporting}
        className={`flex items-center gap-1.5 rounded-lg ${btnCls} disabled:opacity-50 px-3 py-1.5 text-xs font-semibold text-white transition`}>
        <Download className="h-3.5 w-3.5"/>{exporting?'Exporting...':'Export CSV'}
      </button>
    </div>
  </div>
);

const StaffTab = ({ schools }) => {
  const [data,setData]=useState([]); const [total,setTotal]=useState(0);
  const [loading,setLoading]=useState(true); const [exp,setExp]=useState(false);
  const [search,setSearch]=useState(''); const [school,setSchool]=useState('');
  const [role,setRole]=useState(''); const [status,setStatus]=useState('');
  const load = useCallback(async()=>{
    setLoading(true);
    try {
      const p=new URLSearchParams({limit:'200'});
      if(search.trim()) p.append('search',search.trim());
      if(school) p.append('schoolId',school);
      if(role) p.append('role',role);
      if(status) p.append('status',status);
      const r=await apiClient.get('/users?'+p);
      if(r.data?.success){
        const list=(r.data.data?.users||[]).filter(u=>!['STUDENT','PARENT'].includes(u.baseRole));
        setData(list); setTotal(list.length);
      }
    } catch{ toast.error('Failed to load staff.'); } finally{ setLoading(false); }
  },[search,school,role,status]);
  useEffect(()=>{load();},[load]);
  const onExport=()=>{
    const p={};
    if(search.trim()) p.search=search.trim();
    if(school) p.schoolId=school; if(role) p.role=role; if(status) p.status=status;
    downloadCsv('/exports/staff.csv',`staff_${fmt(new Date())}.csv`,p,setExp);
  };
  return (
    <div className="space-y-4">
      <FB count={total} label="staff" onR={load} loading={loading} onExp={onExport} exporting={exp} btnCls="bg-emerald-700 hover:bg-emerald-600">
        <SI value={search} onChange={setSearch} placeholder="Search name or email..." focus="focus:border-emerald-500"/>
        <SF value={school} onChange={setSchool} focus="focus:border-emerald-500">
          <option value="">All Schools</option>
          {schools.map(s=><option key={s._id} value={s._id}>{s.name}</option>)}
        </SF>
        <SF value={role} onChange={setRole} focus="focus:border-emerald-500">
          <option value="">All Roles</option>
          {['ADMIN','SUPERVISOR','HM','TEACHER','PEON'].map(r=><option key={r} value={r}>{r}</option>)}
        </SF>
        <SF value={status} onChange={setStatus} focus="focus:border-emerald-500">
          <option value="">All Statuses</option>
          {['ACTIVE','PENDING_APPROVAL','SUSPENDED','TRANSFERRED','RETIRED','INACTIVE'].map(s=><option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
        </SF>
      </FB>
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/80 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-950/80 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr>{['Full Name & Email','Designation','Role','School','Phone','Status','Registered'].map(h=><th key={h} className="px-4 py-3">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading?<LoadingRow cols={7}/>:data.length===0?<EmptyRow cols={7}/>:data.map(u=>(
                <tr key={u._id} className="hover:bg-slate-800/40 transition">
                  <Td><div className="font-semibold text-white">{u.fullName}</div><div className="flex items-center gap-1 mt-0.5 text-[11px] text-slate-500 font-mono"><Mail className="h-3 w-3"/>{u.email||'—'}</div></Td>
                  <Td><span className="text-amber-300 font-medium">{u.designation||'—'}</span></Td>
                  <Td>{roleBadge(u.role)}</Td>
                  <Td><div className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5 text-slate-500 shrink-0"/><span className="truncate max-w-[160px]">{u.schoolId?.name||'—'}</span></div>{u.schoolId?.schoolCode&&<div className="text-[11px] text-slate-600 font-mono mt-0.5">{u.schoolId.schoolCode}</div>}</Td>
                  <Td>{u.phoneNumber?<div className="flex items-center gap-1 text-slate-400"><Phone className="h-3 w-3"/>{u.phoneNumber}</div>:<span className="text-slate-600">—</span>}</Td>
                  <Td>{statusBadge(u.status)}</Td>
                  <Td className="text-slate-500 font-mono whitespace-nowrap">{fmt(u.createdAt)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StudentsTab = ({ schools }) => {
  const [data,setData]=useState([]); const [total,setTotal]=useState(0);
  const [loading,setLoading]=useState(true); const [exp,setExp]=useState(false);
  const [search,setSearch]=useState(''); const [school,setSchool]=useState('');
  const [status,setStatus]=useState('');
  const load = useCallback(async()=>{
    setLoading(true);
    try {
      const p=new URLSearchParams({role:'STUDENT',limit:'500'});
      if(school) p.append('schoolId',school);
      if(status) p.append('status',status);
      const r=await apiClient.get('/users?'+p);
      if(r.data?.success){
        let list=r.data.data?.users||[];
        if(search.trim()){const q=search.trim().toLowerCase();list=list.filter(s=>(s.fullName||'').toLowerCase().includes(q)||(s.email||'').toLowerCase().includes(q));}
        setData(list); setTotal(list.length);
      }
    } catch{ toast.error('Failed to load students.'); } finally{ setLoading(false); }
  },[search,school,status]);
  useEffect(()=>{load();},[load]);
  const onExport=()=>{
    const p={};
    if(search.trim()) p.search=search.trim();
    if(school) p.schoolId=school; if(status) p.status=status;
    downloadCsv('/exports/students.csv',`students_${fmt(new Date())}.csv`,p,setExp);
  };
  return (
    <div className="space-y-4">
      <FB count={total} label="students" onR={load} loading={loading} onExp={onExport} exporting={exp} btnCls="bg-blue-700 hover:bg-blue-600">
        <SI value={search} onChange={setSearch} placeholder="Search name, GR No..." focus="focus:border-blue-500"/>
        <SF value={school} onChange={setSchool} focus="focus:border-blue-500">
          <option value="">All Schools</option>
          {schools.map(s=><option key={s._id} value={s._id}>{s.name}</option>)}
        </SF>
        <SF value={status} onChange={setStatus} focus="focus:border-blue-500">
          <option value="">All Statuses</option>
          {['ACTIVE','PENDING_APPROVAL','TRANSFERRED','GRADUATED','DROPPED_OUT','INACTIVE'].map(s=><option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
        </SF>
      </FB>
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/80 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-950/80 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr>{['Student','GR No','Global ID','School','Class/Section','Gender','Guardian','Admission','Status'].map(h=><th key={h} className="px-4 py-3">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading?<LoadingRow cols={9}/>:data.length===0?<EmptyRow cols={9}/>:data.map((s,i)=>(
                <tr key={s._id||i} className="hover:bg-slate-800/40 transition">
                  <Td><div className="font-semibold text-white">{s.fullName||'—'}</div>{s.email&&<div className="flex items-center gap-1 mt-0.5 text-[11px] text-slate-500 font-mono"><Mail className="h-3 w-3"/>{s.email}</div>}</Td>
                  <Td><span className="inline-flex items-center gap-1 font-mono text-amber-300 font-bold"><Hash className="h-3 w-3"/>{s.grNumber||'—'}</span></Td>
                  <Td>{s.globalStudentId?<span className="inline-flex items-center gap-1 font-mono text-cyan-400 text-[11px] bg-cyan-950/40 border border-cyan-800/40 rounded px-1.5 py-0.5"><IdCard className="h-3 w-3"/>{s.globalStudentId}</span>:<span className="text-slate-600">—</span>}</Td>
                  <Td><div className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5 text-slate-500 shrink-0"/><span className="truncate max-w-[140px]">{s.schoolId?.name||'—'}</span></div></Td>
                  <Td><div className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5 text-slate-500 shrink-0"/><span>{s.classId?.name||'—'}</span>{s.sectionId?.name&&<span className="text-slate-400 ml-1">/ {s.sectionId.name}</span>}</div></Td>
                  <Td><span className={`font-medium ${s.gender==='MALE'?'text-blue-400':s.gender==='FEMALE'?'text-pink-400':'text-slate-500'}`}>{s.gender||'—'}</span></Td>
                  <Td><div className="truncate max-w-[120px] text-slate-300">{s.fatherOrGuardianName||'—'}</div>{s.guardianContactNumber&&<div className="flex items-center gap-1 mt-0.5 text-[11px] text-slate-500"><Phone className="h-3 w-3"/>{s.guardianContactNumber}</div>}</Td>
                  <Td><div className="flex items-center gap-1 text-slate-400"><CalendarDays className="h-3.5 w-3.5 text-slate-600"/>{s.admissionDate?fmt(s.admissionDate):'—'}</div>{s.admissionType&&<div className="text-[10px] text-slate-600 font-mono mt-0.5">{s.admissionType}</div>}</Td>
                  <Td>{statusBadge(s.lifecycleStatus||s.status)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const GuardiansTab = () => {
  const [data,setData]=useState([]); const [total,setTotal]=useState(0);
  const [loading,setLoading]=useState(true); const [exp,setExp]=useState(false);
  const [search,setSearch]=useState(''); const [status,setStatus]=useState('');
  const load = useCallback(async()=>{
    setLoading(true);
    try {
      const p=new URLSearchParams({role:'PARENT',limit:'500'});
      if(status) p.append('status',status);
      const r=await apiClient.get('/users?'+p);
      if(r.data?.success){
        let list=r.data.data?.users||[];
        if(search.trim()){const q=search.trim().toLowerCase();list=list.filter(u=>(u.fullName||'').toLowerCase().includes(q)||(u.email||'').toLowerCase().includes(q)||(u.phoneNumber||'').includes(search.trim()));}
        setData(list); setTotal(list.length);
      }
    } catch{ toast.error('Failed to load guardians.'); } finally{ setLoading(false); }
  },[search,status]);
  useEffect(()=>{load();},[load]);
  const onExport=()=>{
    const p={};
    if(search.trim()) p.search=search.trim(); if(status) p.status=status;
    downloadCsv('/exports/guardians.csv',`guardians_${fmt(new Date())}.csv`,p,setExp);
  };
  return (
    <div className="space-y-4">
      <FB count={total} label="guardians" onR={load} loading={loading} onExp={onExport} exporting={exp} btnCls="bg-rose-700 hover:bg-rose-600">
        <SI value={search} onChange={setSearch} placeholder="Search name, email, or phone..." focus="focus:border-rose-500"/>
        <SF value={status} onChange={setStatus} focus="focus:border-rose-500">
          <option value="">All Statuses</option>
          {['ACTIVE','PENDING_APPROVAL','SUSPENDED','INACTIVE'].map(s=><option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
        </SF>
      </FB>
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/80 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-950/80 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr>{['Guardian','Email','Phone','Linked Students','Status','Registered'].map(h=><th key={h} className="px-4 py-3">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading?<LoadingRow cols={6}/>:data.length===0?<EmptyRow cols={6}/>:data.map(g=>(
                <tr key={g._id} className="hover:bg-slate-800/40 transition">
                  <Td><div className="font-semibold text-white">{g.fullName}</div></Td>
                  <Td>{g.email?<div className="flex items-center gap-1 font-mono text-[11px] text-slate-400"><Mail className="h-3 w-3 text-slate-500"/>{g.email}</div>:<span className="text-slate-600">—</span>}</Td>
                  <Td>{g.phoneNumber?<div className="flex items-center gap-1 text-slate-400"><Phone className="h-3 w-3 text-slate-500"/>{g.phoneNumber}</div>:<span className="text-slate-600">—</span>}</Td>
                  <Td>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 border border-slate-700 px-2 py-0.5 text-[11px] text-slate-400">
                      <GraduationCap className="h-3 w-3 text-amber-400"/><span className="text-amber-300 font-semibold">{g.linkedStudentsCount??'?'}</span><span>linked</span>
                    </span>
                    <p className="text-[10px] text-slate-600 mt-0.5">Full list in CSV export</p>
                  </Td>
                  <Td>{statusBadge(g.status)}</Td>
                  <Td className="text-slate-500 font-mono whitespace-nowrap">{fmt(g.createdAt)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const TABS=[
  {id:'staff',    label:'Staff Directory',    icon:Users,         adminOnly:false},
  {id:'students', label:'Students Directory',  icon:GraduationCap, adminOnly:false},
  {id:'guardians',label:'Guardians Directory', icon:Heart,         adminOnly:true},
];
const ACCENT={
  staff:    {a:'border-emerald-500 text-emerald-400',h:'hover:text-emerald-400 hover:border-emerald-600/40'},
  students: {a:'border-blue-500 text-blue-400',      h:'hover:text-blue-400 hover:border-blue-600/40'},
  guardians:{a:'border-rose-500 text-rose-400',      h:'hover:text-rose-400 hover:border-rose-600/40'},
};

export const DirectoryPage = () => {
  const {user}=useSelector(s=>s.auth);
  const isAdmin=['ROOT_ADMIN','SUPER_ADMIN','ADMIN'].includes(user?.role);
  const [tab,setTab]=useState('staff');
  const [schools,setSchools]=useState([]);
  useEffect(()=>{
    apiClient.get('/schools?limit=200').then(r=>{if(r.data?.success)setSchools(r.data.data?.schools||[]);}).catch(()=>{});
  },[]);
  const tabs=TABS.filter(t=>!t.adminOnly||isAdmin);
  return (
    <PageContainer title="Institutional Directory" subtitle="Education Department Liaquatabad Town — Staff, Students & Guardian records with CSV export">
      <div className="space-y-6">
        <div className="flex items-center gap-0 border-b border-slate-800 overflow-x-auto">
          {tabs.map(t=>{
            const Ic=t.icon; const ac=ACCENT[t.id]; const active=tab===t.id;
            return (
              <button key={t.id} type="button" onClick={()=>setTab(t.id)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${active?ac.a:`border-transparent text-slate-500 ${ac.h}`}`}>
                <Ic className="h-4 w-4"/>{t.label}
              </button>
            );
          })}
        </div>
        {tab==='staff'     && <StaffTab     schools={schools}/>}
        {tab==='students'  && <StudentsTab  schools={schools}/>}
        {tab==='guardians' && <GuardiansTab/>}
      </div>
    </PageContainer>
  );
};
export default DirectoryPage;
