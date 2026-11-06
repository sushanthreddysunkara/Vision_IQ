import {
  Activity,
  AlertTriangle,
  Camera,
  CircleDollarSign,
  Cpu,
  Database,
  FileText,
  Home,
  LineChart,
  MapPinned,
  Network,
  Search,
  ShieldCheck,
  UploadCloud,
  Video,
  Wrench,
} from 'lucide-react'

export const navigation = [
  { label: 'Dashboard', path: '/home', icon: Home, exact: true },
  { label: 'Toll & Revenue', path: '/toll-revenue', icon: CircleDollarSign },
  { label: 'Query', path: '/query', icon: Search },
  { label: 'Knowledge Graph', path: '/knowledge-graph', icon: Network },
  { label: 'Ontology', path: '/ontology', icon: Database },
  { label: 'Traffic Flow', path: '/dashboards/traffic', icon: Activity },
  { label: 'Camera Network', path: '/dashboards/cameras', icon: Camera },
  { label: 'Incidents', path: '/vehicle-information', icon: AlertTriangle },
  { label: 'Evidence Tracking', path: '/evidence-tracking', icon: MapPinned },
  { label: 'Assets & Maintenance', path: '/assets-maintenance', icon: Wrench },
  { label: 'Reports', path: '/document-intelligence', icon: FileText },
  { label: 'Rules & Events', path: '/rules-events', icon: ShieldCheck },
  { label: 'Models', path: '/models', icon: Cpu },
]

export const routePaths = navigation.map(({ path }) => path)
