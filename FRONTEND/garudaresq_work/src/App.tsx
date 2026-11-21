/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * GarudaResQ - Dehradun Region Disaster Response & Tactical Relief Network
 * Upgraded GIS Engine:
 * - Dynamic Location Risk Assessment Block (Citizen Portal)
 * - Map Auto-Pan & Smooth Camera Tracking (flyTo on location change)
 * - Real OpenStreetMap OSRM Street Routing for Citizen & NGO Dispatch
 * - Multi-Shelter Incharge Authentication & Authorized Facility Isolation
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import L from 'leaflet';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  MapPin,
  Flame,
  Radio,
  Users,
  Compass,
  Navigation,
  PhoneCall,
  Home,
  CheckCircle2,
  Lock,
  LogIn,
  LogOut,
  Layers,
  Activity,
  HeartHandshake,
  Crosshair,
  Package,
  Droplets,
  Zap,
  Info,
  Clock,
  Sparkles,
  Search,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  X,
  Plus,
  Minus,
  Send,
  Siren,
  Route,
  LocateFixed,
  Building2,
  Eye,
  AlertOctagon,
  LifeBuoy,
  Bed,
  CheckSquare,
  Shield,
  Truck,
  UserCheck,
  Filter,
  Sliders,
  Settings2,
  PhoneForwarded,
  FileSpreadsheet,
  Waves,
  Mountain,
  ArrowRight,
  Maximize2,
  Minimize2,
  Car,
  Footprints,
  CornerUpRight,
  CornerUpLeft,
  ArrowUp,
  RotateCw,
  ShieldX,
  Compass as CompassIcon,
  Navigation2
} from 'lucide-react';

// ==========================================
// TYPES & DATA ARCHITECTURE
// ==========================================
export type UserRole = 'citizen' | 'ngo' | 'shelter';
export type AppView = 'home' | 'citizen' | 'ngo' | 'shelter' | 'contacts';

export interface Shelter {
  id: string;
  name: string;
  locationArea: string;
  coordinates: [number, number];
  totalCapacity: number;
  currentOccupancy: number;
  status: 'operational' | 'high_occupancy' | 'full';
  contactPerson: string;
  phone: string;
  resources: {
    foodPacks: number;
    waterLiters: number;
    medicalKits: number;
    generatorPower: boolean;
    blankets: number;
  };
  initialResources: {
    foodPacks: number;
    waterLiters: number;
    medicalKits: number;
    blankets: number;
  };
  lastUpdated: string;
  facilities: string[];
}

export interface CitizenRequest {
  id: string;
  citizenName: string;
  locationName: string;
  coordinates: [number, number];
  category: 'Flood' | 'Landslide' | 'Structural Damage' | 'Medical';
  priority: 'critical' | 'high' | 'moderate' | 'low';
  peopleCount: number;
  description: string;
  timestamp: string;
  status: 'pending' | 'dispatched' | 'acquired' | 'resolved';
  acquiredBy?: string;
  contactNumber: string;
}

export interface TriagedCitizenRequest extends CitizenRequest {
  triageScore: number;
  triageRank: number;
  isInsideHazard: boolean;
  distToHazardKm: number;
  triageBadgeLabel: string;
}

export interface EvacueeLogEntry {
  id: string;
  shelterId: string;
  headOfFamily: string;
  peopleCount: number;
  originArea: string;
  checkInTime: string;
  medicalNeeds: string;
  allocatedBlock: string;
  status: 'Checked-In' | 'Treated' | 'Discharged';
}

export interface DisasterSimulation {
  active: boolean;
  hazardKey: string;
  hazardName: string;
  severity: 'RED ALERT' | 'ORANGE ADVISORY';
  center: [number, number];
  radiusMeters: number; // 1500m (1.5 km)
  affectedZones: string[];
  description: string;
  riverBasin: string;
}

export interface EmergencyContact {
  id: string;
  agency: string;
  category: string;
  phone: string;
  altPhone?: string;
  location: string;
  badge: '24/7 National' | 'State SDRF' | 'District Command' | 'Medical Trauma' | 'Police';
  description: string;
}

export interface PresetLocation {
  id: string;
  name: string;
  coordinates: [number, number];
  zoneType: string;
}

export interface RouteGeometryResult {
  coordinates: [number, number][]; // [lat, lng]
  distanceKm: number;
  durationMins: number;
  source: 'osrm' | 'fallback';
}

export interface AuthenticatedUser {
  role: 'ngo' | 'shelter';
  username: string;
  label: string;
  assignedShelterId?: string;
  isRestricted?: boolean;
}

// ==========================================
// DEHRADUN DATASETS
// ==========================================
const DEHRADUN_CENTER: [number, number] = [30.3256, 78.0436]; // Centered at Clock Tower

export const PRESET_ZONES: PresetLocation[] = [
  { id: 'clock-tower', name: 'Clock Tower (Paltan Bazaar)', coordinates: [30.3256, 78.0436], zoneType: 'Commercial Central' },
  { id: 'parade-ground', name: 'Parade Ground / Lansdowne', coordinates: [30.3242, 78.0465], zoneType: 'Central Administrative' },
  { id: 'clement-town', name: 'Clement Town (Graphic Era)', coordinates: [30.2684, 78.0071], zoneType: 'Southern Sector' },
  { id: 'isbt', name: 'ISBT (Transport Nagar)', coordinates: [30.2858, 78.0084], zoneType: 'Highway Transit Corridor' },
  { id: 'rajpur-road', name: 'Rajpur Road (Jakhan)', coordinates: [30.3653, 78.0776], zoneType: 'Northern Foothill' },
  { id: 'prem-nagar', name: 'Prem Nagar (Chakrata Road)', coordinates: [30.3341, 77.9629], zoneType: 'Western Corridor' },
  { id: 'raipur', name: 'Raipur (Sports Complex)', coordinates: [30.3090, 78.0980], zoneType: 'Eastern Valley' },
  { id: 'dalanwala', name: 'Dalanwala (Circular Road)', coordinates: [30.3180, 78.0550], zoneType: 'Residential Sector' },
  { id: 'garhi-cantt', name: 'Garhi Cantt (Army Area)', coordinates: [30.3450, 78.0280], zoneType: 'Northwestern Cantonment' },
  { id: 'sahastradhara', name: 'Sahastradhara Road (IT Park)', coordinates: [30.3550, 78.0820], zoneType: 'Northeastern Corridor' },
];

export interface DisasterScenarioPreset {
  key: string;
  label: string;
  name: string;
  center: [number, number];
  affectedZones: string[];
  riverBasin: string;
  description: string;
}

export const DISASTER_SCENARIOS: DisasterScenarioPreset[] = [
  {
    key: 'clement-town',
    label: 'Clement Town Flood',
    name: 'Clement Town & Subhash Nagar Flash Flood',
    center: [30.2684, 78.0071],
    affectedZones: ['Clement Town Cantonment', 'Graphic Era Corridor', 'Subhash Nagar', 'Asan Tributary Lows'],
    riverBasin: 'Asan River Basin',
    description: 'Cloudburst triggered low-lying southern drainage blockages and severe waterlogging near Clement Town.',
  },
  {
    key: 'rajpur',
    label: 'Rajpur Road Landslide',
    name: 'Rajpur Road & Jakhan Torrential Landslide',
    center: [30.3653, 78.0776],
    affectedZones: ['Jakhan Foothill Dip', 'Old Rajpur Stream', 'Mussoorie Diversion', 'Malsi Corridor'],
    riverBasin: 'Shivalik Torrential Slope Drainage',
    description: 'Debris flows and slope subsidence have blocked upper Rajpur Road with heavy mud runoff.',
  },
  {
    key: 'isbt',
    label: 'ISBT Waterlogging',
    name: 'ISBT Transport Hub & Haridwar Bypass Inundation',
    center: [30.2858, 78.0084],
    affectedZones: ['Transport Nagar', 'ISBT Terminal Main Concourse', 'Haridwar Bypass Culverts', 'Majra Outflow'],
    riverBasin: 'Rispana Outflow & Majra Drain',
    description: 'Severe highway culvert overflow caused arterial water surges and impassable underpasses around ISBT.',
  },
  {
    key: 'prem-nagar',
    label: 'Prem Nagar Flash Flood',
    name: 'Prem Nagar & Chakrata Corridor River Surge',
    center: [30.3341, 77.9629],
    affectedZones: ['Prem Nagar Market', 'Chakrata Road Bridge', 'Tons River Dip', 'IMA Outer Boundary'],
    riverBasin: 'Tons River Channel',
    description: 'Tons river overflow spilled across low sections of Chakrata Road near Prem Nagar bridge.',
  },
  {
    key: 'raipur',
    label: 'Raipur Cloudburst',
    name: 'Raipur & Song River Basin Cloudburst',
    center: [30.3090, 78.0980],
    affectedZones: ['Raipur Sports Complex Lows', 'Ordnance Factory Road', 'Song River Belt', 'Maldevta Foothills'],
    riverBasin: 'Song River Basin',
    description: 'Massive cloudburst over the eastern ridges triggered flash surges cutting off river crossings in Raipur.',
  },
  {
    key: 'clock-tower',
    label: 'Clock Tower Emergency',
    name: 'Clock Tower & Paltan Bazaar Urban Flash Crisis',
    center: [30.3256, 78.0436],
    affectedZones: ['Clock Tower Intersection', 'Paltan Bazaar Lows', 'Gandhi Park Perimeter', 'Rajpur Road Confluence'],
    riverBasin: 'Central Bindal Catchment Basin',
    description: 'Urban flash water pooling and commercial building structural threats around Paltan Bazaar and Clock Tower.',
  },
  {
    key: 'parade-ground',
    label: 'Parade Ground Severe Inundation',
    name: 'Parade Ground & Lansdowne Urban Inundation',
    center: [30.3242, 78.0465],
    affectedZones: ['Parade Ground Periphery', 'Lansdowne Chowk', 'Court Compound Road', 'Subhash Road Concourse'],
    riverBasin: 'Bindal Nallah Floodplain',
    description: 'Severe stormwater surcharge overflowing Bindal river culverts and inundating central Parade Ground hub.',
  },
  {
    key: 'dalanwala',
    label: 'Dalanwala Structural Collapse',
    name: 'Dalanwala Sector Structural Collapse & Flash Hazards',
    center: [30.3180, 78.0550],
    affectedZones: ['Circular Road', 'EC Road Sector', 'Rispana River Embankment', 'Teg Bahadur Road'],
    riverBasin: 'Rispana River Corridor',
    description: 'River bank scouring and masonry building subsidence along Rispana river edge across Dalanwala.',
  },
  {
    key: 'garhi-cantt',
    label: 'Garhi Cantt Landslide',
    name: 'Garhi Cantt & Cantonment Ridge Landslide',
    center: [30.3450, 78.0280],
    affectedZones: ['Garhi Cantt Main Road', 'Birpur Barracks Escarpment', 'Tons Western Slopes', 'Tapkeshwar Road'],
    riverBasin: 'Tons Valley Escarpment',
    description: 'Steep hillside mudslides and boulder falls blocking key cantonment transit routes and Tapkeshwar approach.',
  },
  {
    key: 'sahastradhara',
    label: 'Sahastradhara Road Debris Flow',
    name: 'Sahastradhara Road & IT Park Torrential Debris Flow',
    center: [30.3550, 78.0820],
    affectedZones: ['IT Park Boulevard', 'Sahastradhara Foothills', 'Kasturi Nagar Dip', 'Song River Headwaters'],
    riverBasin: 'Song-Sahastradhara Torrent Basin',
    description: 'Torrential gravel runoff and heavy debris flows blocking transit corridor on Sahastradhara Road near IT Park.',
  },
];

// ==========================================
// 10 EXPANDED REAL DEHRADUN SHELTERS
// ==========================================
const INITIAL_SHELTERS: Shelter[] = [
  {
    id: 'shelter-1',
    name: 'Clock Tower Evacuation Center',
    locationArea: 'Paltan Bazaar / Rajpur Road',
    coordinates: [30.3256, 78.0436],
    totalCapacity: 650,
    currentOccupancy: 390,
    status: 'operational',
    contactPerson: 'Capt. Arun Rawat (Retd.)',
    phone: '+91 94120 89201',
    resources: {
      foodPacks: 950,
      waterLiters: 3800,
      medicalKits: 110,
      generatorPower: true,
      blankets: 620,
    },
    initialResources: {
      foodPacks: 1200,
      waterLiters: 4500,
      medicalKits: 140,
      blankets: 700,
    },
    facilities: ['Field Kitchen', 'Emergency Triage', 'Clean Sanitation', 'Emergency Power', 'VHF Comms'],
    lastUpdated: '5 mins ago',
  },
  {
    id: 'shelter-2',
    name: 'Parade Ground Mega Relief Hub',
    locationArea: 'Lansdowne Chowk / Subhash Road',
    coordinates: [30.3242, 78.0465],
    totalCapacity: 1500,
    currentOccupancy: 860,
    status: 'operational',
    contactPerson: 'Dr. Meenakshi Joshi (SDM Relief)',
    phone: '+91 94111 23405',
    resources: {
      foodPacks: 2400,
      waterLiters: 8500,
      medicalKits: 320,
      generatorPower: true,
      blankets: 1450,
    },
    initialResources: {
      foodPacks: 3000,
      waterLiters: 10000,
      medicalKits: 400,
      blankets: 1800,
    },
    facilities: ['10-Bed Mobile Hospital', 'Helipad Zone', 'Ambulance Fleet', 'Rations Depot', 'Satellite Link'],
    lastUpdated: '3 mins ago',
  },
  {
    id: 'shelter-3',
    name: 'ISBT Transport Nagar Safe Zone',
    locationArea: 'Haridwar Bypass Highway',
    coordinates: [30.2858, 78.0084],
    totalCapacity: 850,
    currentOccupancy: 560,
    status: 'operational',
    contactPerson: 'Inspector Vijay Negi',
    phone: '+91 98970 45678',
    resources: {
      foodPacks: 780,
      waterLiters: 3400,
      medicalKits: 90,
      generatorPower: true,
      blankets: 580,
    },
    initialResources: {
      foodPacks: 1100,
      waterLiters: 4500,
      medicalKits: 120,
      blankets: 750,
    },
    facilities: ['Evacuation Bus Fleet', 'Heavy Logistics Depot', 'First Aid Station', 'Rest Tents'],
    lastUpdated: '12 mins ago',
  },
  {
    id: 'shelter-4',
    name: 'Clement Town Graphic Era Relief Shelter',
    locationArea: 'Bell Road / Graphic Era Campus Sector',
    coordinates: [30.2684, 78.0071],
    totalCapacity: 700,
    currentOccupancy: 310,
    status: 'operational',
    contactPerson: 'Col. D.S. Bhandari',
    phone: '+91 94101 56789',
    resources: {
      foodPacks: 920,
      waterLiters: 3900,
      medicalKits: 130,
      generatorPower: true,
      blankets: 650,
    },
    initialResources: {
      foodPacks: 1200,
      waterLiters: 5000,
      medicalKits: 160,
      blankets: 800,
    },
    facilities: ['Secure Campus Compound', 'Clean Potable Wells', 'Emergency Telecom Link', 'Dormitories'],
    lastUpdated: '8 mins ago',
  },
  {
    id: 'shelter-5',
    name: 'Rajpur Road Community Center',
    locationArea: 'Near Jakhan / Mussoorie Diversion',
    coordinates: [30.3653, 78.0776],
    totalCapacity: 450,
    currentOccupancy: 395,
    status: 'high_occupancy',
    contactPerson: 'Smt. Kavita Sharma',
    phone: '+91 94115 78912',
    resources: {
      foodPacks: 380,
      waterLiters: 1600,
      medicalKits: 55,
      generatorPower: true,
      blankets: 320,
    },
    initialResources: {
      foodPacks: 600,
      waterLiters: 2500,
      medicalKits: 80,
      blankets: 450,
    },
    facilities: ['Mountain Rescue Staging', 'Satellite Phone Link', 'Rope & Harness Stash', 'High-Ground Deck'],
    lastUpdated: '2 mins ago',
  },
  {
    id: 'shelter-6',
    name: 'Prem Nagar Stadium Shelter',
    locationArea: 'Chakrata Road / IMA Corridor',
    coordinates: [30.3341, 77.9629],
    totalCapacity: 950,
    currentOccupancy: 540,
    status: 'operational',
    contactPerson: 'Maj. Pradeep Thapa',
    phone: '+91 94121 90871',
    resources: {
      foodPacks: 1200,
      waterLiters: 4800,
      medicalKits: 150,
      generatorPower: true,
      blankets: 750,
    },
    initialResources: {
      foodPacks: 1600,
      waterLiters: 6000,
      medicalKits: 200,
      blankets: 950,
    },
    facilities: ['Covered Sports Stadium', 'Military Medical Post', 'Mass Kitchen Area', 'Perimeter Security'],
    lastUpdated: '10 mins ago',
  },
  {
    id: 'shelter-7',
    name: 'Raipur Sports Complex Safe Zone',
    locationArea: 'Maharana Pratap Sports Stadium, Raipur',
    coordinates: [30.3090, 78.0980],
    totalCapacity: 1300,
    currentOccupancy: 670,
    status: 'operational',
    contactPerson: 'Shri Harish Rawat (Admin)',
    phone: '+91 94117 33451',
    resources: {
      foodPacks: 2100,
      waterLiters: 7400,
      medicalKits: 260,
      generatorPower: true,
      blankets: 1100,
    },
    initialResources: {
      foodPacks: 2800,
      waterLiters: 9000,
      medicalKits: 350,
      blankets: 1400,
    },
    facilities: ['Mega Stadium Infield', 'Helipad Staging Zone', 'Ambulance Base', 'Solar Microgrid Backup'],
    lastUpdated: '6 mins ago',
  },
  {
    id: 'shelter-8',
    name: 'Dalanwala Emergency Hub',
    locationArea: 'Circular Road / Dalanwala Sector',
    coordinates: [30.3180, 78.0550],
    totalCapacity: 500,
    currentOccupancy: 290,
    status: 'operational',
    contactPerson: 'Dr. Anita Bahuguna',
    phone: '+91 98370 12894',
    resources: {
      foodPacks: 650,
      waterLiters: 2700,
      medicalKits: 95,
      generatorPower: true,
      blankets: 440,
    },
    initialResources: {
      foodPacks: 900,
      waterLiters: 3500,
      medicalKits: 130,
      blankets: 550,
    },
    facilities: ['Community Hall', 'Clean Water Filtration', 'Pediatric Care Ward', 'Diesel Generator'],
    lastUpdated: '14 mins ago',
  },
  {
    id: 'shelter-9',
    name: 'Garhi Cantt Army Grounds Shelter',
    locationArea: 'Cantt Board Complex / Garhi',
    coordinates: [30.3450, 78.0280],
    totalCapacity: 1100,
    currentOccupancy: 520,
    status: 'operational',
    contactPerson: 'Subedar M.S. Gusain',
    phone: '+91 94103 44552',
    resources: {
      foodPacks: 1750,
      waterLiters: 6200,
      medicalKits: 220,
      generatorPower: true,
      blankets: 980,
    },
    initialResources: {
      foodPacks: 2200,
      waterLiters: 7500,
      medicalKits: 280,
      blankets: 1200,
    },
    facilities: ['Military Medical Depot', 'Search & Rescue Stash', 'High Security Zone', 'Water Tankers'],
    lastUpdated: '18 mins ago',
  },
  {
    id: 'shelter-10',
    name: 'Sahastradhara Road Relief Base',
    locationArea: 'IT Park / Sahastradhara Road',
    coordinates: [30.3550, 78.0820],
    totalCapacity: 600,
    currentOccupancy: 410,
    status: 'operational',
    contactPerson: 'Er. Rajesh Kothari',
    phone: '+91 94113 88129',
    resources: {
      foodPacks: 750,
      waterLiters: 3100,
      medicalKits: 85,
      generatorPower: true,
      blankets: 490,
    },
    initialResources: {
      foodPacks: 1000,
      waterLiters: 4000,
      medicalKits: 120,
      blankets: 650,
    },
    facilities: ['IT Park Auditorium', 'Ambulance Staging Hub', 'High-Speed Telecom Link', 'Dry Ration Stores'],
    lastUpdated: '7 mins ago',
  },
];

const INITIAL_CITIZEN_REQUESTS: CitizenRequest[] = [
  {
    id: 'GR-REQ-9012',
    citizenName: 'Deepak Nautiyal',
    locationName: 'Tapovan / Lower Sahastradhara Road',
    coordinates: [30.3458, 78.0789],
    category: 'Flood',
    priority: 'critical',
    peopleCount: 4,
    description: 'Rispana tributary overflowed into ground floor. 2 elderly seniors with heart condition trapped on 1st floor roof. Need boat evac.',
    timestamp: '8 mins ago',
    status: 'pending',
    contactNumber: '+91 98971 11223',
  },
  {
    id: 'GR-REQ-9013',
    citizenName: 'Priya Semwal',
    locationName: 'Rispana Nagar (Near Chander Nagar Bridge)',
    coordinates: [30.3089, 78.0465],
    category: 'Medical',
    priority: 'critical',
    peopleCount: 3,
    description: 'Flash water surge entered basti. Infant suffering from respiratory distress. Water depth 3.5 feet.',
    timestamp: '14 mins ago',
    status: 'acquired',
    acquiredBy: 'Garuda Alpha Response Unit (You)',
    contactNumber: '+91 94129 44556',
  },
  {
    id: 'GR-REQ-9014',
    citizenName: 'Gurpreet Singh',
    locationName: 'Prem Nagar / Chakrata Road',
    coordinates: [30.3341, 77.9628],
    category: 'Medical',
    priority: 'high',
    peopleCount: 2,
    description: 'Power grid collapsed. Generator fuel exhausted for home ventilator. Emergency battery backup below 20%.',
    timestamp: '25 mins ago',
    status: 'dispatched',
    acquiredBy: 'Prem Nagar Rapid Medic 02',
    contactNumber: '+91 97600 77889',
  },
  {
    id: 'GR-REQ-9015',
    citizenName: 'Anand Bisht',
    locationName: 'Karanpur (Near DAV College)',
    coordinates: [30.3312, 78.0512],
    category: 'Structural Damage',
    priority: 'moderate',
    peopleCount: 6,
    description: 'Drinking water pipeline ruptured by mud accumulation. Retaining wall cracked. 6 students stranded in PG hostel.',
    timestamp: '40 mins ago',
    status: 'pending',
    contactNumber: '+91 99972 33445',
  },
  {
    id: 'GR-REQ-9016',
    citizenName: 'Meera Negi & Joint Family',
    locationName: 'Subhash Nagar / Lowland Basti',
    coordinates: [30.2695, 78.0090],
    category: 'Flood',
    priority: 'critical',
    peopleCount: 12,
    description: 'Ground floor submerged under 4.5 feet water. 12 family members including toddlers and seniors trapped on roof.',
    timestamp: '2 mins ago',
    status: 'pending',
    contactNumber: '+91 94120 77112',
  },
];

const INITIAL_EVACUEE_LOG: EvacueeLogEntry[] = [
  {
    id: 'EVAC-401',
    shelterId: 'shelter-2',
    headOfFamily: 'Suresh Chandra Sharma',
    peopleCount: 4,
    originArea: 'Rispana Nagar Basin',
    checkInTime: '22 mins ago',
    medicalNeeds: 'Infant asthma inhaler provided',
    allocatedBlock: 'Hall A - Cot 12-15',
    status: 'Checked-In',
  },
  {
    id: 'EVAC-402',
    shelterId: 'shelter-2',
    headOfFamily: 'Savitri Devi Rawat',
    peopleCount: 2,
    originArea: 'Tapovan / Sahastradhara Dip',
    checkInTime: '45 mins ago',
    medicalNeeds: 'Hypertension monitoring & warm blankets',
    allocatedBlock: 'Elderly Ward - Bed 04',
    status: 'Treated',
  },
  {
    id: 'EVAC-403',
    shelterId: 'shelter-2',
    headOfFamily: 'Mohammad Irfan',
    peopleCount: 5,
    originArea: 'Chander Nagar Culvert',
    checkInTime: '1 hour ago',
    medicalNeeds: 'Dry rations & footwear replacement',
    allocatedBlock: 'Family Pod C - 22',
    status: 'Checked-In',
  },
  {
    id: 'EVAC-404',
    shelterId: 'shelter-2',
    headOfFamily: 'Kiran Thapa',
    peopleCount: 3,
    originArea: 'Dalanwala Riverbank',
    checkInTime: '2 hours ago',
    medicalNeeds: 'Minor foot abrasions dressed',
    allocatedBlock: 'Hall B - Cot 08',
    status: 'Checked-In',
  },
];

const EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    id: 'ec-1',
    agency: 'State Disaster Response Force (SDRF Uttarakhand)',
    category: 'Tactical Search & Rescue',
    phone: '1070',
    altPhone: '+91 94111 12985',
    location: 'SDRF HQ, Jolly Grant / Dehradun Hub',
    badge: 'State SDRF',
    description: 'Dedicated swift-water rescue, mountain landslide deployment, and aerial evacuation coordination.',
  },
  {
    id: 'ec-2',
    agency: 'District Disaster Management Authority (DDMA)',
    category: 'District Incident Command',
    phone: '0135-2626066',
    altPhone: '0135-2726066',
    location: 'Collectorate Compound, Dehradun',
    badge: 'District Command',
    description: 'Apex civil administration disaster control room for relief distribution, shelter logistics, and flood alerts.',
  },
  {
    id: 'ec-3',
    agency: 'Dehradun Police Emergency Control Room',
    category: 'Law Enforcement & Quick Response',
    phone: '112',
    altPhone: '0135-2716203',
    location: 'Police Lines, Race Course, Dehradun',
    badge: 'Police',
    description: 'Emergency highway blockades, traffic diversion from inundated river bridges, and instant dispatch.',
  },
  {
    id: 'ec-4',
    agency: 'Government Doon Medical College & Hospital',
    category: 'Trauma & Emergency Care',
    phone: '0135-2659012',
    altPhone: '108 (State Ambulance)',
    location: 'Patel Nagar / Court Road, Dehradun',
    badge: 'Medical Trauma',
    description: '24/7 Level-1 trauma care, emergency mass casualty ward, and blood bank coordination.',
  },
  {
    id: 'ec-5',
    agency: 'Indian Red Cross Society (Dehradun Chapter)',
    category: 'Humanitarian & First Aid',
    phone: '0135-2749444',
    location: 'Subhash Road, Dehradun',
    badge: '24/7 National',
    description: 'Disaster hygiene kits, dry food distribution, emergency blood supply, and volunteer corps.',
  },
  {
    id: 'ec-6',
    agency: 'Uttarakhand Forest Department (Wild & Landslide Cell)',
    category: 'Forest & Slope Protection',
    phone: '1926',
    altPhone: '0135-2531698',
    location: 'Rajpur Road, Dehradun',
    badge: 'District Command',
    description: 'Landslide clearing on Mussoorie-Dehradun route, tree falls on arterial roads, and flash stream alerts.',
  },
];

export interface NgoPresetBase {
  id: string;
  name: string;
  shortLabel: string;
  locationArea: string;
  coordinates: [number, number];
  roleDescription: string;
}

export const NGO_PRESET_BASES: NgoPresetBase[] = [
  {
    id: 'ddma-hq',
    name: 'DDMA Apex HQ',
    shortLabel: 'DDMA Apex HQ [30.3256, 78.0436]',
    locationArea: 'Clock Tower / Collectorate Compound, Dehradun',
    coordinates: [30.3256, 78.0436],
    roleDescription: 'Apex Civil Administration Disaster Operations & Central Logistics Hub',
  },
  {
    id: 'clement-town-hq',
    name: 'Clement Town HQ',
    shortLabel: 'Clement Town HQ [30.2684, 78.0071]',
    locationArea: 'Graphic Era Corridor, Southern Sector',
    coordinates: [30.2684, 78.0071],
    roleDescription: 'Southern Drainage Management, Waterlogging Teams & Relief Convoys',
  },
  {
    id: 'isbt-base',
    name: 'ISBT Relief Base',
    shortLabel: 'ISBT Relief Base [30.2858, 78.0084]',
    locationArea: 'Transport Nagar, Haridwar Bypass',
    coordinates: [30.2858, 78.0084],
    roleDescription: 'Highway Transit Corridor, Bypass Underpass & Heavy Gear Depot',
  },
  {
    id: 'police-lines',
    name: 'Police Lines Rapid Response Depot',
    shortLabel: 'Police Lines Depot [30.3204, 78.0500]',
    locationArea: 'Race Course, Central Dehradun',
    coordinates: [30.3204, 78.0500],
    roleDescription: 'Emergency Vehicle Fleet, Flood Rescue Boats & Swift Deployments',
  },
  {
    id: 'it-park',
    name: 'IT Park Relief Base',
    shortLabel: 'IT Park Relief Base [30.3550, 78.0820]',
    locationArea: 'Sahastradhara Road, Northeast Corridor',
    coordinates: [30.3550, 78.0820],
    roleDescription: 'Northeastern Foothills Tactical Gear, Drone Recon & Medical Supply',
  },
  {
    id: 'prem-nagar-post',
    name: 'Prem Nagar Forward Response Post',
    shortLabel: 'Prem Nagar Post [30.3341, 77.9629]',
    locationArea: 'Chakrata Road, Western Corridor',
    coordinates: [30.3341, 77.9629],
    roleDescription: 'Western Valley, IMA Perimeter & Tons River Quick Response Team',
  },
];

// Default starting fallback coordinate
export const NGO_COMMAND_BASE: [number, number] = NGO_PRESET_BASES[0].coordinates;

// ==========================================
// GIS HELPERS: HAVERSINE & OSRM REAL STREET ROUTING
// ==========================================
function getDistanceInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDistance(distKm: number): string {
  if (distKm < 1) {
    return `${Math.round(distKm * 1000)} m`;
  }
  return `${distKm.toFixed(1)} km`;
}

// Fallback generator for street grid waypoints if OSRM is offline or blocked
function generateDehradunFallbackRoads(
  start: [number, number],
  end: [number, number]
): [number, number][] {
  const points: [number, number][] = [start];
  const midLat = (start[0] + end[0]) / 2;
  const midLng = (start[1] + end[1]) / 2;
  points.push([start[0], midLng]);
  points.push([midLat, midLng]);
  points.push([end[0], midLng]);
  points.push(end);
  return points;
}

// In-memory cache for OSRM routes
const osrmRouteCache = new Map<string, RouteGeometryResult>();

async function fetchOsrmStreetRoute(
  start: [number, number],
  end: [number, number]
): Promise<RouteGeometryResult> {
  const cacheKey = `${start[0].toFixed(5)},${start[1].toFixed(5)}->${end[0].toFixed(5)},${end[1].toFixed(5)}`;
  if (osrmRouteCache.has(cacheKey)) {
    return osrmRouteCache.get(cacheKey)!;
  }

  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const primaryRoute = data.routes[0];
        const latLngCoordinates: [number, number][] = primaryRoute.geometry.coordinates.map(
          (c: [number, number]) => [c[1], c[0]]
        );
        const distanceKm = primaryRoute.distance / 1000;
        const durationMins = Math.max(1, Math.round(primaryRoute.duration / 60));

        const result: RouteGeometryResult = {
          coordinates: latLngCoordinates,
          distanceKm,
          durationMins,
          source: 'osrm',
        };
        osrmRouteCache.set(cacheKey, result);
        return result;
      }
    }
  } catch (err) {
    console.warn('OSRM router fetch error or timeout, applying street grid fallback:', err);
  }

  const fallbackCoords = generateDehradunFallbackRoads(start, end);
  const airDist = getDistanceInKm(start[0], start[1], end[0], end[1]);
  const roadDist = airDist * 1.28;
  const result: RouteGeometryResult = {
    coordinates: fallbackCoords,
    distanceKm: roadDist,
    durationMins: Math.max(2, Math.round((roadDist / 26) * 60)),
    source: 'fallback',
  };
  osrmRouteCache.set(cacheKey, result);
  return result;
}

// ==========================================
// MAIN COMPONENT
// ==========================================
export default function App() {
  // Navigation & Role View Routing
  const [activeView, setActiveView] = useState<AppView>('home');
  const [currentRole, setCurrentRole] = useState<UserRole>('citizen');

  // Fullscreen Map States
  const [isCitizenMapFullscreen, setIsCitizenMapFullscreen] = useState<boolean>(false);
  const [isNgoMapFullscreen, setIsNgoMapFullscreen] = useState<boolean>(false);
  const [isShelterMapFullscreen, setIsShelterMapFullscreen] = useState<boolean>(false);

  // Global State (Synced across all views)
  const [shelters, setShelters] = useState<Shelter[]>(INITIAL_SHELTERS);
  useEffect(() => {
  fetch('/api/shelters')
    .then((res) => {
      if (!res.ok) throw new Error('Shelter fetch failed');
      return res.json();
    })
    .then((result) => {
      if (result.success && result.data.length > 0) {
        setShelters((prev) =>
          result.data.map((s: any) => {
            const existing = prev.find((item) => item.id === s.id);

            return {
              ...existing,
              id: s.id,
              name: s.name,
              locationArea: s.locationArea,
              coordinates: [Number(s.latitude), Number(s.longitude)],
              totalCapacity: Number(s.totalCapacity),
              currentOccupancy: Number(s.currentOccupancy),
              status: s.status,
              contactPerson: s.contactPerson,
              phone: s.phone,
              resources: s.resources
              ? {
              ...existing?.resources,
              foodPacks: Number(s.resources.foodPacks),
              waterLiters: Number(s.resources.waterLiters),
              medicalKits: Number(s.resources.medicalKits),
              blankets: Number(s.resources.blankets),
              }
              : existing?.resources,
            };
          })
        );
      }
    })
    .catch((error) => console.error('Shelter API:', error));
}, []);
  const [citizenRequests, setCitizenRequests] = useState<CitizenRequest[]>(INITIAL_CITIZEN_REQUESTS);
  const [evacueeLogs, setEvacueeLogs] = useState<EvacueeLogEntry[]>(INITIAL_EVACUEE_LOG);
  // Managed Shelter for Shelter Incharge View (default: Parade Ground Shelter)
  const [managedShelterId, setManagedShelterId] = useState<string>('shelter-2');
  const managedShelter = useMemo(
    () => shelters.find((s) => s.id === managedShelterId) || shelters[0],
    [shelters, managedShelterId]
  );
  useEffect(() => {
  if (!managedShelterId) return;

  fetch(`/api/evacuees?shelterId=${managedShelterId}`)
    .then((res) => {
      if (!res.ok) throw new Error('Evacuee fetch failed');
      return res.json();
    })
    .then((result) => {
      if (result.success) {
        setEvacueeLogs(result.data.map((e: any) => ({
          id: e.id,
          shelterId: e.shelterId,
          headOfFamily: e.headOfFamily,
          peopleCount: Number(e.peopleCount),
          originArea: e.originArea,
          checkInTime: e.checkInTime,
          medicalNeeds: e.medicalNeeds,
          allocatedBlock: e.allocatedBlock,
          status: e.status,
        })));
      }
    })
    .catch((error) => console.error('Evacuee API:', error));
}, [managedShelterId]);

  // Citizen Fixed Location State (Strictly Fixed GPS Location)
  const [citizenLocation, setCitizenLocation] = useState<[number, number]>(DEHRADUN_CENTER);
  const [locationLabel, setLocationLabel] = useState<string>('Clock Tower (Paltan Bazaar)');
  const [isGpsLocating, setIsGpsLocating] = useState<boolean>(false);

  // Disaster Simulation State (Multiple Scenario Dropdown)
  const [selectedDisasterKey, setSelectedDisasterKey] = useState<string>('clement-town');
  const [simulation, setSimulation] = useState<DisasterSimulation>({
    active: true,
    hazardKey: 'clement-town',
    hazardName: 'Clement Town & Subhash Nagar Flash Flood',
    severity: 'RED ALERT',
    center: [30.2684, 78.0071],
    radiusMeters: 1500, // 1.5 km
    affectedZones: ['Clement Town Cantonment', 'Graphic Era Corridor', 'Subhash Nagar', 'Asan Tributary Lows'],
    description: 'Cloudburst triggered low-lying southern drainage blockages and severe waterlogging near Clement Town.',
    riverBasin: 'Asan River Basin',

  });

  // Sticky Details Card on Map Click
  const [stickyShelterCard, setStickyShelterCard] = useState<Shelter | null>(null);

  // Active Safe Route Target (Citizen Evacuation Route)
  const [activeSafeRouteTarget, setActiveSafeRouteTarget] = useState<Shelter | null>(null);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [isRouteCalculating, setIsRouteCalculating] = useState<boolean>(false);
  const [currentRouteGeometry, setCurrentRouteGeometry] = useState<RouteGeometryResult | null>(null);

  // NGO Tactical Dispatch State (Real-street OSRM route)
  const [activeDispatchedIncident, setActiveDispatchedIncident] = useState<CitizenRequest | null>(null);
  const [selectedNgoRequestId, setSelectedNgoRequestId] = useState<string | null>(null);
  const [ngoRouteGeometry, setNgoRouteGeometry] = useState<RouteGeometryResult | null>(null);
  const [isNgoRouteCalculating, setIsNgoRouteCalculating] = useState<boolean>(false);

  // Leaflet Instances and Markers Map
  const citizenMapContainerRef = useRef<HTMLDivElement | null>(null);
  const citizenMapInstanceRef = useRef<L.Map | null>(null);
  const citizenUserMarkerRef = useRef<L.Marker | null>(null);

  const ngoMapContainerRef = useRef<HTMLDivElement | null>(null);
  const ngoMapInstanceRef = useRef<L.Map | null>(null);
  const ngoMarkersMapRef = useRef<Map<string, L.Marker>>(new Map());

  const shelterMapContainerRef = useRef<HTMLDivElement | null>(null);
  const shelterMapInstanceRef = useRef<L.Map | null>(null);

  // Modals & Panels
  const [isDualSosModalOpen, setIsDualSosModalOpen] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isCustomCapacityModalOpen, setIsCustomCapacityModalOpen] = useState<boolean>(false);
  const [customCapacityValue, setCustomCapacityValue] = useState<string>('');
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState<boolean>(false);
  const [checkInName, setCheckInName] = useState<string>('');
  const [checkInPeopleCount, setCheckInPeopleCount] = useState<number>(3);
  const [checkInOrigin, setCheckInOrigin] = useState<string>('');
  const [checkInNeeds, setCheckInNeeds] = useState<string>('');

  // Report Emergency State
  const [reportPhone, setReportPhone] = useState('');
  const [reportLandmark, setReportLandmark] = useState('');
  const [reportCategory, setReportCategory] = useState<'Flood' | 'Landslide' | 'Structural Damage' | 'Medical'>('Flood');
  const [reportPeopleCount, setReportPeopleCount] = useState<number>(2);
  const [reportSeverity, setReportSeverity] = useState<'moderate' | 'high' | 'critical'>('critical');
  const [reportDescription, setReportDescription] = useState('');
  const [isEmergencySubmitting, setIsEmergencySubmitting] = useState(false);

  // Instant SOS Overlay
  const [sosAlertOverlay, setSosAlertOverlay] = useState<{
    isOpen: boolean;
    trackingId: string;
    coords: [number, number];
    timestamp: string;
  } | null>(null);

  // Authentication State (Multi-Shelter & NGO)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [targetAuthRole, setTargetAuthRole] = useState<'ngo' | 'shelter'>('ngo');
  const [authUsername, setAuthUsername] = useState<string>('shelter_clocktower');
  const [authPassword, setAuthPassword] = useState<string>('safe123');
  const [authError, setAuthError] = useState<string>('');
  const [authenticatedUser, setAuthenticatedUser] = useState<AuthenticatedUser | null>(null);

  // NGO View Filters
  const [ngoPriorityFilter, setNgoPriorityFilter] = useState<string>('all');
  const [ngoCategoryFilter, setNgoCategoryFilter] = useState<string>('all');
  const [ngoSearchQuery, setNgoSearchQuery] = useState<string>('');

  // NGO Live Location & Dynamic Map Positioning State
  const [ngoLocation, setNgoLocation] = useState<[number, number]>(NGO_PRESET_BASES[0].coordinates);
  const [ngoPresetBases, setNgoPresetBases] = useState<NgoPresetBase[]>(NGO_PRESET_BASES);
  const [ngoLocationLabel, setNgoLocationLabel] = useState<string>(NGO_PRESET_BASES[0].name);
  const [selectedNgoBaseId, setSelectedNgoBaseId] = useState<string>(NGO_PRESET_BASES[0].id);
  const [isNgoGpsActive, setIsNgoGpsActive] = useState<boolean>(false);
  const [isFetchingNgoGps, setIsFetchingNgoGps] = useState<boolean>(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'alert' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'alert' | 'info' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4500);
  };
  useEffect(() => {
  fetch('http://localhost:8080/api/ngo-bases')
    .then((res) => {
      if (!res.ok) throw new Error('Failed to fetch NGO bases');
      return res.json();
    })
    .then((result) => {
      if (result.success && result.data.length > 0) {
        const bases: NgoPresetBase[] = result.data.map((b: any) => ({
          id: b.id,
          name: b.name,
          shortLabel: b.shortLabel,
          locationArea: b.locationArea,
          coordinates: [Number(b.latitude), Number(b.longitude)],
          roleDescription: b.roleDescription,
        }));

        setNgoPresetBases(bases);
        setSelectedNgoBaseId(bases[0].id);
        setNgoLocation(bases[0].coordinates);
        setNgoLocationLabel(bases[0].name);
      }
    })
    .catch((error) => console.error('NGO bases error:', error));
}, []);
  // Helper: Is coordinates inside disaster circle?
  const isInsideHazardZone = useCallback(
    (coords: [number, number]): boolean => {
      if (!simulation.active) return false;
      const distKm = getDistanceInKm(coords[0], coords[1], simulation.center[0], simulation.center[1]);
      return distKm * 1000 <= simulation.radiusMeters;
    },
    [simulation.active, simulation.center, simulation.radiusMeters]
  );

  // ==============================================================
  // REQUIREMENT 1: DYNAMIC LOCATION RISK ASSESSMENT CALCULATION
  // ==============================================================
  const userHazardDistanceKm = useMemo(() => {
    if (!simulation.active) return 999;
    return getDistanceInKm(citizenLocation[0], citizenLocation[1], simulation.center[0], simulation.center[1]);
  }, [citizenLocation, simulation]);

  const locationRiskLevel = useMemo<'HIGH' | 'MODERATE' | 'LOW'>(() => {
    if (!simulation.active) return 'LOW';
    // High risk if inside 1.5 km hazard zone or within 2 km radius
    if (userHazardDistanceKm <= 2.0 || isInsideHazardZone(citizenLocation)) {
      return 'HIGH';
    }
    // Moderate risk if between 2 km and 10 km
    if (userHazardDistanceKm <= 10.0) {
      return 'MODERATE';
    }
    // Low risk if > 10 km or simulation OFF
    return 'LOW';
  }, [simulation.active, userHazardDistanceKm, isInsideHazardZone, citizenLocation]);

  // Calculate Nearest Safe Operational Shelter
  const nearestSafeShelter = useMemo(() => {
    const safeCandidates = shelters.filter((s) => !isInsideHazardZone(s.coordinates) && s.status !== 'full');
    if (safeCandidates.length === 0) return null;
    let nearest = safeCandidates[0];
    let minDistance = getDistanceInKm(citizenLocation[0], citizenLocation[1], nearest.coordinates[0], nearest.coordinates[1]);
    for (let i = 1; i < safeCandidates.length; i++) {
      const dist = getDistanceInKm(citizenLocation[0], citizenLocation[1], safeCandidates[i].coordinates[0], safeCandidates[i].coordinates[1]);
      if (dist < minDistance) {
        minDistance = dist;
        nearest = safeCandidates[i];
      }
    }
    return nearest;
  }, [shelters, citizenLocation, isInsideHazardZone]);

  // Route metrics (Real OSRM distance and duration)
  const activeRouteShelter = activeSafeRouteTarget;
  const routeDistanceKm = currentRouteGeometry ? currentRouteGeometry.distanceKm : 0;
  const driveTimeMins = currentRouteGeometry ? currentRouteGeometry.durationMins : 0;
  const walkTimeMins = useMemo(() => {
    if (!currentRouteGeometry) return 0;
    return Math.max(5, Math.round((currentRouteGeometry.distanceKm / 4.2) * 60));
  }, [currentRouteGeometry]);

  // Handle Stop Navigation
  const handleStopNavigation = () => {
    setIsNavigating(false);
    setActiveSafeRouteTarget(null);
    setCurrentRouteGeometry(null);
    showToast('Evacuation navigation paused. Fixed citizen standby mode active.', 'info');
  };

  // ==============================================================
  // REQUIREMENT 2: MAP AUTO-PAN & CAMERA TRACKING HELPER
  // ==============================================================
  const flyCameraToUser = useCallback((coords: [number, number]) => {
    if (citizenMapInstanceRef.current) {
      citizenMapInstanceRef.current.flyTo(coords, 15, {
        animate: true,
        duration: 1.5,
      });
    }
    if (ngoMapInstanceRef.current && activeView === 'ngo') {
      ngoMapInstanceRef.current.flyTo(coords, 15, {
        animate: true,
        duration: 1.5,
      });
    }
  }, [activeView]);

  // ==============================================================
  // DISASTER SIMULATION DROPDOWN HANDLER
  // ==============================================================
  const handleDisasterSelect = (scenarioKey: string) => {
    setSelectedDisasterKey(scenarioKey);

    if (scenarioKey === 'none') {
      setSimulation({
        active: false,
        hazardKey: 'none',
        hazardName: 'No Active Hazard',
        severity: 'ORANGE ADVISORY',
        center: DEHRADUN_CENTER,
        radiusMeters: 1500,
        affectedZones: [],
        description: 'Normal tactical monitoring resumed across Dehradun.',
        riverBasin: 'Normal Baseline Drainage',
      });
      showToast('DISASTER SIMULATION CLEARED: All 10 Dehradun shelters marked SAFE.', 'info');
      return;
    }

    let scenario: DisasterScenarioPreset | undefined;

    if (scenarioKey === 'random') {
      // Dynamic random coordinates across Dehradun bounds: Lat [30.2680, 30.3650], Lng [77.9650, 78.0950]
      const randomLat = Number((30.2680 + Math.random() * 0.0970).toFixed(4));
      const randomLng = Number((77.9650 + Math.random() * 0.1300).toFixed(4));
      scenario = {
        key: 'random',
        label: `Dynamic Random Hazard [${randomLat}, ${randomLng}]`,
        name: `Dynamic Dehradun Sector Hazard [${randomLat}, ${randomLng}]`,
        center: [randomLat, randomLng],
        affectedZones: [
          `Unmapped Perimeter (${randomLat}, ${randomLng})`,
          'Dynamic Dehradun Buffer Zone (1.5 km)',
          'Immediate Road Corridors',
        ],
        riverBasin: 'Dynamic Valley Catchment & Tributaries',
        description: `Spontaneous flash hazard generated at coordinates [${randomLat}, ${randomLng}]. Red zone safety perimeter activated.`,
      };
    } else {
      scenario = DISASTER_SCENARIOS.find((s) => s.key === scenarioKey);
    }

    if (!scenario) return;

    const newCenter = scenario.center;
    setSimulation({
      active: true,
      hazardKey: scenario.key,
      hazardName: scenario.name,
      severity: 'RED ALERT',
      center: newCenter,
      radiusMeters: 1500,
      affectedZones: scenario.affectedZones,
      description: scenario.description,
      riverBasin: scenario.riverBasin,
    });

    // Check if the current routed shelter has become UNSAFE
    if (activeSafeRouteTarget) {
      const distToHazard = getDistanceInKm(
        activeSafeRouteTarget.coordinates[0],
        activeSafeRouteTarget.coordinates[1],
        newCenter[0],
        newCenter[1]
      );

      if (distToHazard * 1000 <= 1500) {
        const alternateSafe = shelters.filter(
          (s) =>
            s.id !== activeSafeRouteTarget.id &&
            getDistanceInKm(s.coordinates[0], s.coordinates[1], newCenter[0], newCenter[1]) * 1000 > 1500 &&
            s.status !== 'full'
        );

        if (alternateSafe.length > 0) {
          alternateSafe.sort((a, b) => {
            const dA = getDistanceInKm(citizenLocation[0], citizenLocation[1], a.coordinates[0], a.coordinates[1]);
            const dB = getDistanceInKm(citizenLocation[0], citizenLocation[1], b.coordinates[0], b.coordinates[1]);
            return dA - dB;
          });
          const reroutedShelter = alternateSafe[0];
          showToast(
            `  ${activeSafeRouteTarget.name} is now inside the HAZARD ZONE! Auto-rerouting to nearest safe hub: ${reroutedShelter.name}`,
            'alert'
          );
          handleStartEvacuation(reroutedShelter);
        } else {
          handleStopNavigation();
          showToast(`  All nearby shelters in this sector are affected by ${scenario.name}! Routing suspended.`, 'alert');
        }
        return;
      }
    }

    showToast(
      `  HAZARD ZONE ACTIVATED: ${scenario.name}. 1.5 km Red Zone circle spawned. Unsafe shelters flagged!`,
      'alert'
    );
  };

  // ==============================================================
  // REAL ROAD ROUTING: CITIZEN EVACUATION TRIGGER
  // ==============================================================
  const handleStartEvacuation = async (shelter: Shelter) => {
    if (isInsideHazardZone(shelter.coordinates)) {
      showToast(`Cannot route to ${shelter.name}: Located inside the active UNSAFE Hazard Zone!`, 'alert');
      return;
    }

    setActiveSafeRouteTarget(shelter);
    setIsNavigating(true);
    setIsRouteCalculating(true);
    switchView('citizen');

    showToast(`Calculating safest street route to ${shelter.name} via real Dehradun roads...`, 'info');

    try {
      const routeResult = await fetchOsrmStreetRoute(citizenLocation, shelter.coordinates);
      setCurrentRouteGeometry(routeResult);
      setIsRouteCalculating(false);

      if (citizenMapInstanceRef.current) {
        citizenMapInstanceRef.current.fitBounds([citizenLocation, shelter.coordinates], {
          padding: [70, 70],
          maxZoom: 16,
        });
      }

      showToast(
        `Safe street route acquired (${formatDistance(routeResult.distanceKm)}   ~${routeResult.durationMins} min drive) strictly following Dehradun roads.`,
        'success'
      );
    } catch {
      setIsRouteCalculating(false);
      showToast('Error calculating street route. Applied arterial grid route.', 'info');
    }
  };

  // Re-calculate street route whenever citizenLocation changes during active navigation
  useEffect(() => {
    if (activeSafeRouteTarget && isNavigating && !isInsideHazardZone(activeSafeRouteTarget.coordinates)) {
      fetchOsrmStreetRoute(citizenLocation, activeSafeRouteTarget.coordinates).then((routeResult) => {
        setCurrentRouteGeometry(routeResult);
      });
    }
  }, [citizenLocation, activeSafeRouteTarget, isNavigating, isInsideHazardZone]);

  // ==============================================================
  // NGO LIVE GPS, DYNAMIC CAMERA TRACKING & BASE SELECTION
  // ==============================================================
  const flyNgoCamera = useCallback((coords: [number, number], zoom = 14) => {
    if (ngoMapInstanceRef.current) {
      ngoMapInstanceRef.current.invalidateSize();
      ngoMapInstanceRef.current.flyTo(coords, zoom, {
        animate: true,
        duration: 1.2,
      });
    }
  }, []);

  const handleSelectNgoBase = (baseId: string) => {
    setSelectedNgoBaseId(baseId);
    setIsNgoGpsActive(false);
    const matched = ngoPresetBases.find((b) => b.id === baseId);
    if (matched) {
      setNgoLocation(matched.coordinates);
      setNgoLocationLabel(matched.name);
      flyNgoCamera(matched.coordinates, 15);
      showToast(`NGO Tactical Base updated to: ${matched.name}. Camera tracked to base location.`, 'info');

      // If team is currently dispatched, re-calculate real-road route from this new base location
      if (activeDispatchedIncident) {
        setIsNgoRouteCalculating(true);
        fetchOsrmStreetRoute(matched.coordinates, activeDispatchedIncident.coordinates)
          .then((routeResult) => {
            setNgoRouteGeometry(routeResult);
            setIsNgoRouteCalculating(false);
            if (ngoMapInstanceRef.current && routeResult.coordinates.length > 0) {
              const routePolyline = L.polyline(routeResult.coordinates);
              ngoMapInstanceRef.current.fitBounds(routePolyline.getBounds(), {
                padding: [50, 50],
              });
            }
          })
          .catch(() => setIsNgoRouteCalculating(false));
      }
    }
  };

  const handleUseNgoLiveGPS = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser.', 'alert');
      return;
    }
    setIsFetchingNgoGps(true);
    showToast('Acquiring high-accuracy live GPS for NGO Response Team...', 'info');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const liveCoords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setNgoLocation(liveCoords);
        setNgoLocationLabel(
          `Field Unit Live GPS (${pos.coords.accuracy ? `±${Math.round(pos.coords.accuracy)}m` : 'High Precision'})`
        );
        setIsNgoGpsActive(true);
        setSelectedNgoBaseId('live-gps');
        setIsFetchingNgoGps(false);

        flyNgoCamera(liveCoords, 15);
        showToast(
          `NGO Live GPS Locked: [${liveCoords[0].toFixed(5)}, ${liveCoords[1].toFixed(5)}] • Map centered on Field Team`,
          'success'
        );

        if (activeDispatchedIncident) {
          setIsNgoRouteCalculating(true);
          fetchOsrmStreetRoute(liveCoords, activeDispatchedIncident.coordinates)
            .then((routeResult) => {
              setNgoRouteGeometry(routeResult);
              setIsNgoRouteCalculating(false);
              if (ngoMapInstanceRef.current && routeResult.coordinates.length > 0) {
                const routePolyline = L.polyline(routeResult.coordinates);
                ngoMapInstanceRef.current.fitBounds(routePolyline.getBounds(), {
                  padding: [50, 50],
                });
              }
            })
            .catch(() => setIsNgoRouteCalculating(false));
        }
      },
      (err) => {
        setIsFetchingNgoGps(false);
        showToast(`GPS Acquisition Notice: ${err.message}. Maintaining selected command base.`, 'alert');
      },
      { timeout: 8000, enableHighAccuracy: true, maximumAge: 0 }
    );
  };

  // ==============================================================
  // DYNAMIC NGO-TO-VICTIM DISPATCH ROUTING (OSRM ROAD NETWORK)
  // ==============================================================
 const handleDeployResponseTeam = async (req: CitizenRequest) => {
  try {
    const teamsResponse = await fetch('/api/rescue-teams');
    const teamsResult = await teamsResponse.json();

    if (!teamsResult.success) {
      throw new Error('Could not fetch rescue teams');
    }

    const availableTeam = teamsResult.data.find(
      (team: any) => team.available === true
    );

    if (!availableTeam) {
      showToast('No rescue team available!', 'alert');
      return;
    }

    const deployResponse = await fetch(
     '/api/rescue-teams/deploy',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          teamID: String(availableTeam.teamID),
          requestID: req.id.replace(/^GR-REQ-/, ''),
        }),
      }
    );

    const deployResult = await deployResponse.json();

    if (!deployResult.success) {
      throw new Error(deployResult.message);
    }

    setCitizenRequests((prev) =>
      prev.map((r) =>
        r.id === req.id
          ? {
              ...r,
              status: 'dispatched',
              acquiredBy: availableTeam.teamName,
            }
          : r
      )
    );

    setActiveDispatchedIncident(req);
    setSelectedNgoRequestId(req.id);
    setIsNgoRouteCalculating(true);

    showToast(`Deploying ${availableTeam.teamName} to ${req.locationName}...`, 'info');

    const routeResult = await fetchOsrmStreetRoute(ngoLocation, req.coordinates);

    setNgoRouteGeometry(routeResult);
    setIsNgoRouteCalculating(false);

    if (ngoMapInstanceRef.current) {
      ngoMapInstanceRef.current.invalidateSize();

      if (routeResult.coordinates?.length > 0) {
        const routePolyline = L.polyline(routeResult.coordinates);
        ngoMapInstanceRef.current.fitBounds(routePolyline.getBounds(), {
          padding: [50, 50],
        });
      }
    }

    showToast(
      `${availableTeam.teamName} deployed successfully!`,
      'success'
    );
  } catch (error) {
    setIsNgoRouteCalculating(false);
    showToast(
      error instanceof Error ? error.message : 'Team deployment failed',
      'alert'
    );
  }
};

  const handleFocusRequestOnMap = (req: CitizenRequest) => {
    setSelectedNgoRequestId(req.id);
    if (ngoMapInstanceRef.current) {
      ngoMapInstanceRef.current.flyTo(req.coordinates, 15, { animate: true, duration: 1.2 });
      const marker = ngoMarkersMapRef.current.get(req.id);
      if (marker) {
        setTimeout(() => marker.openPopup(), 450);
      }
    }
  };

  const handleResolveIncident = (requestId: string) => {
    setCitizenRequests((prev) =>
      prev.map((req) => (req.id === requestId ? { ...req, status: 'resolved' } : req))
    );
    if (activeDispatchedIncident?.id === requestId) {
      setActiveDispatchedIncident(null);
      setNgoRouteGeometry(null);
    }
    showToast(`Distress incident ${requestId} marked as RESOLVED and safe.`, 'success');
  };

  // View switching with invalidation and automatic camera focus
  const switchView = (targetView: AppView) => {
    setActiveView(targetView);
    setStickyShelterCard(null);
    [50, 150, 300].forEach((delay) => {
      setTimeout(() => {
        if (targetView === 'citizen' && citizenMapInstanceRef.current) {
          citizenMapInstanceRef.current.invalidateSize();
        } else if (targetView === 'ngo' && ngoMapInstanceRef.current) {
          ngoMapInstanceRef.current.invalidateSize();
          if (activeDispatchedIncident && ngoRouteGeometry?.coordinates.length) {
            const polyline = L.polyline(ngoRouteGeometry.coordinates);
            ngoMapInstanceRef.current.fitBounds(polyline.getBounds(), { padding: [50, 50] });
          } else {
            ngoMapInstanceRef.current.flyTo(ngoLocation, 14, { animate: true });
          }
        } else if (targetView === 'shelter' && shelterMapInstanceRef.current) {
          shelterMapInstanceRef.current.invalidateSize();
        }
      }, delay);
    });
  };

  const toggleMapFullscreen = (type: 'citizen' | 'ngo' | 'shelter') => {
    if (type === 'citizen') {
      setIsCitizenMapFullscreen((prev) => {
        const next = !prev;
        setTimeout(() => citizenMapInstanceRef.current?.invalidateSize(), 150);
        return next;
      });
    } else if (type === 'ngo') {
      setIsNgoMapFullscreen((prev) => {
        const next = !prev;
        setTimeout(() => ngoMapInstanceRef.current?.invalidateSize(), 150);
        return next;
      });
    } else if (type === 'shelter') {
      setIsShelterMapFullscreen((prev) => {
        const next = !prev;
        setTimeout(() => shelterMapInstanceRef.current?.invalidateSize(), 150);
        return next;
      });
    }
  };

  const handleSelectRole = (role: UserRole) => {
    if (role === 'citizen') {
      setCurrentRole('citizen');
      setAuthenticatedUser(null);
      switchView('citizen');
      showToast('Switched to Citizen Emergency Dashboard', 'success');
    } else {
      if (authenticatedUser && authenticatedUser.role === role) {
        setCurrentRole(role);
        switchView(role === 'ngo' ? 'ngo' : 'shelter');
        showToast(`Welcome back, ${authenticatedUser.label}`, 'success');
      } else {
        setTargetAuthRole(role);
        if (role === 'ngo') {
          setAuthUsername('ngo_admin');
          setAuthPassword('resq123');
        } else {
          setAuthUsername('shelter_clocktower');
          setAuthPassword('safe123');
        }
        setAuthError('');
        setIsAuthModalOpen(true);
      }
    }
  };

  // ==============================================================
  // REQUIREMENT 4: MULTI-SHELTER INCHARGE AUTHENTICATION & SWITCHER
  // ==============================================================
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (targetAuthRole === 'ngo') {
      if (authUsername === 'ngo_admin' && authPassword === 'resq123') {
        const user: AuthenticatedUser = {
          role: 'ngo',
          username: authUsername,
          label: 'NGO Relief Operations Commander',
        };
        setAuthenticatedUser(user);
        setCurrentRole('ngo');
        setIsAuthModalOpen(false);
        switchView('ngo');
        showToast('Authenticated: Welcome to NGO Tactical Command Center', 'success');
      } else {
        setAuthError('Invalid credentials. Use ngo_admin / resq123');
      }
      return;
    }

    if (targetAuthRole === 'shelter') {
      // Map shelter username to exact shelter ID
      const shelterAuthMap: Record<string, { shelterId: string; name: string }> = {
        shelter_clocktower: { shelterId: 'shelter-1', name: 'Clock Tower Evacuation Center' },
        shelter_parade: { shelterId: 'shelter-2', name: 'Parade Ground Mega Relief Hub' },
        shelter_isbt: { shelterId: 'shelter-3', name: 'ISBT Transport Nagar Safe Zone' },
        shelter_clement: { shelterId: 'shelter-4', name: 'Clement Town Graphic Era Relief Shelter' },
        shelter_dehradun: { shelterId: 'shelter-2', name: 'District Relief Operations Supervisor' }, // Superadmin
      };

      const matchedFacility = shelterAuthMap[authUsername.trim().toLowerCase()];

      if (matchedFacility && authPassword === 'safe123') {
        const isSuper = authUsername.toLowerCase() === 'shelter_dehradun';
        const user: AuthenticatedUser = {
          role: 'shelter',
          username: authUsername,
          label: matchedFacility.name,
          assignedShelterId: matchedFacility.shelterId,
          isRestricted: !isSuper,
        };
        setAuthenticatedUser(user);
        setCurrentRole('shelter');
        setManagedShelterId(matchedFacility.shelterId);
        setIsAuthModalOpen(false);
        switchView('shelter');
        showToast(`Authenticated: Incharge access granted for ${matchedFacility.name}`, 'success');
      } else {
        setAuthError('Invalid credentials. Check the multi-shelter hint IDs below.');
      }
    }
  };

  const handleLogout = () => {
    setAuthenticatedUser(null);
    setCurrentRole('citizen');
    switchView('home');
    showToast('Logged out. Switched to Home Landing Page.', 'info');
  };

  // Shelter Incharge Actions
  const handleAdjustOccupancy = async (shelterId: string, delta: number) => {
  if (
    authenticatedUser?.role === 'shelter' &&
    authenticatedUser.isRestricted &&
    authenticatedUser.assignedShelterId !== shelterId
  ) {
    showToast('Permission denied: You are only authorized to manage your assigned facility.', 'alert');
    return;
  }

  try {
    const response = await fetch('/api/shelters/occupancy', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ shelterId, delta }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Occupancy update failed');
    }

    setShelters((prev) =>
      prev.map((s) =>
        s.id === shelterId
          ? {
              ...s,
              currentOccupancy: Number(result.data.currentOccupancy),
              status: result.data.status,
              lastUpdated: 'Just now',
            }
          : s
      )
    );

    showToast(`Shelter occupancy updated successfully (${delta > 0 ? `+${delta}` : delta}).`, 'success');
  } catch (error) {
    console.error('Occupancy update:', error);
    showToast('Unable to update occupancy. Please try again.', 'alert');
  }
};
  const handleSetCustomOccupancy = async (e: React.FormEvent) => {
  e.preventDefault();

  const val = parseInt(customCapacityValue, 10);

  if (isNaN(val) || val < 0) {
    showToast('Please enter a valid occupancy number.', 'alert');
    return;
  }

  const clamped = Math.min(managedShelter.totalCapacity, val);

  try {
    const response = await fetch('/api/shelters/occupancy', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        shelterId: managedShelterId,
        occupancy: clamped,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Occupancy update failed');
    }

    setShelters((prev) =>
      prev.map((s) =>
        s.id === managedShelterId
          ? {
              ...s,
              currentOccupancy: Number(result.data.currentOccupancy),
              status: result.data.status,
              lastUpdated: 'Just now',
            }
          : s
      )
    );

    setIsCustomCapacityModalOpen(false);
    setCustomCapacityValue('');

    showToast(`Custom occupancy updated for ${managedShelter.name}.`, 'success');
  } catch (error) {
    console.error('Custom occupancy:', error);
    showToast('Unable to update occupancy.', 'alert');
  }
};
  const handleAdjustResource = async (
  shelterId: string,
  resourceKey: 'foodPacks' | 'waterLiters' | 'medicalKits' | 'blankets',
  delta: number
) => {
  if (
    authenticatedUser?.role === 'shelter' &&
    authenticatedUser.isRestricted &&
    authenticatedUser.assignedShelterId !== shelterId
  ) {
    showToast('Permission denied: You are only authorized to manage your assigned facility.', 'alert');
    return;
  }

  try {
    const response = await fetch('/api/shelters/resources', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ shelterId, resourceKey, delta }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Resource update failed');
    }

    setShelters((prev) =>
      prev.map((s) =>
        s.id === shelterId
          ? {
              ...s,
              resources: {
                ...s.resources,
                [resourceKey]: Number(result.data.quantity),
              },
              lastUpdated: 'Just now',
            }
          : s
      )
    );

    showToast('Resource inventory updated successfully.', 'success');
  } catch (error) {
    console.error('Resource update:', error);
    showToast('Unable to update resource inventory.', 'alert');
  }
};
  const handleCheckInEvacueeSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!checkInName || !checkInOrigin) {
    showToast('Please provide head of family name and origin location.', 'alert');
    return;
  }

  if (checkInPeopleCount <= 0) {
    showToast('Please enter a valid number of people.', 'alert');
    return;
  }

  try {
    const response = await fetch('/api/evacuees', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        shelterId: managedShelterId,
        headOfFamily: checkInName,
        peopleCount: checkInPeopleCount,
        originArea: checkInOrigin,
        medicalNeeds: checkInNeeds || 'Standard intake / dry rations',
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Evacuee check-in failed');
    }

    const newEntry: EvacueeLogEntry = {
      id: result.data.evacuee.id,
      shelterId: managedShelterId,
      headOfFamily: checkInName,
      peopleCount: checkInPeopleCount,
      originArea: checkInOrigin,
      checkInTime: 'Just now',
      medicalNeeds: checkInNeeds || 'Standard intake / dry rations',
      allocatedBlock: result.data.evacuee.allocatedBlock,
      status: 'Checked-In',
    };

    setEvacueeLogs((prev) => [newEntry, ...prev]);

    setShelters((prev) =>
      prev.map((s) =>
        s.id === managedShelterId
          ? {
              ...s,
              currentOccupancy: Number(result.data.shelter.currentOccupancy),
              status: result.data.shelter.status,
              lastUpdated: 'Just now',
            }
          : s
      )
    );

    setIsCheckInModalOpen(false);
    setCheckInName('');
    setCheckInOrigin('');
    setCheckInNeeds('');
    setCheckInPeopleCount(3);

    showToast(`Evacuee family checked into ${managedShelter.name}!`, 'success');
  } catch (error) {
    console.error('Evacuee check-in:', error);
    showToast('Unable to check in evacuees. Please try again.', 'alert');
  }
};
  // ==============================================================
  // REQUIREMENT 2: GPS & PRESET SELECTION WITH SMOOTH FLYTO
  // ==============================================================
  const handleUseLiveGPS = () => {
    setIsGpsLocating(true);
    if (!navigator.geolocation) {
      setCitizenLocation(DEHRADUN_CENTER);
      setLocationLabel('Clock Tower (Paltan Bazaar)');
      setIsGpsLocating(false);
      flyCameraToUser(DEHRADUN_CENTER);
      showToast('Geolocation not supported. Centered at Dehradun Clock Tower.', 'info');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setCitizenLocation(coords);
        setLocationLabel('My Live GPS Position');
        setIsGpsLocating(false);
        flyCameraToUser(coords);
        showToast(`GPS acquired: ${coords[0].toFixed(4)} N, ${coords[1].toFixed(4)} E &bull; Centering map`, 'success');
      },
      (err) => {
        console.warn('GPS Error:', err.message);
        setCitizenLocation(DEHRADUN_CENTER);
        setLocationLabel('Clock Tower (Paltan Bazaar - Fallback)');
        setIsGpsLocating(false);
        flyCameraToUser(DEHRADUN_CENTER);
        showToast('GPS prompt dismissed. Centered at Clock Tower [30.3256, 78.0436].', 'info');
      },
      { timeout: 7000, enableHighAccuracy: true }
    );
  };

  const handleSelectPresetZone = (zoneId: string) => {
    const target = PRESET_ZONES.find((z) => z.id === zoneId);
    if (target) {
      setCitizenLocation(target.coordinates);
      setLocationLabel(target.name);
      // Smoothly pan & auto-zoom onto the selected user location
      flyCameraToUser(target.coordinates);
      showToast(`Camera tracked to ${target.name} (${target.zoneType})`, 'info');
    }
  };

  // Instant One-Tap SOS Broadcast
  const handleInstantSOS = () => {
    const trackingId = `#GR-SOS-${Math.floor(1000 + Math.random() * 9000)}`;
    const newRequest: CitizenRequest = {
      id: trackingId,
      citizenName: 'Citizen Emergency SOS (Instant)',
      locationName: locationLabel || 'Dehradun Citizen Zone',
      coordinates: citizenLocation,
      category: 'Flood',
      priority: 'critical',
      peopleCount: 1,
      description: 'INSTANT ONE-TAP SOS BEACON ACTIVATED. Rapid rescue extraction required immediately.',
      timestamp: 'Just now',
      status: 'pending',
      contactNumber: 'BROADCAST VIA APP',
    };
    setCitizenRequests((prev) => [newRequest, ...prev]);
    setIsDualSosModalOpen(false);
    setSosAlertOverlay({
      isOpen: true,
      trackingId,
      coords: citizenLocation,
      timestamp: 'Just now',
    });
    showToast(`CRITICAL SOS DISPATCHED (${trackingId})! Broadcast to NGO Triage & Shelter Feeds!`, 'alert');
  };

  const handleReportAssistanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportPhone || !reportLandmark || !reportDescription) {
      showToast('Please fill out all required fields.', 'alert');
      return;
    }

    setIsEmergencySubmitting(true);
    const numericRequestId = String(Math.floor(100000 + Math.random() * 900000));
    const trackingId = `GR-REQ-${numericRequestId}`;
    const citizenName = `Citizen Report (${reportPhone.slice(-4)})`;
    const injuryLevel = reportSeverity === 'critical' ? 5 : reportSeverity === 'high' ? 4 : 3;
    const priorityScore = reportSeverity === 'critical' ? 100 : reportSeverity === 'high' ? 75 : 45;

    const formData = new URLSearchParams({
      requestID: numericRequestId,
      name: citizenName,
      location: reportLandmark,
      peopleAffected: String(Math.max(1, reportPeopleCount || 1)),
      injuryLevel: String(injuryLevel),
      disasterType: reportCategory,
      requiredResource: 'Emergency Assistance',
      citizenName,
      category: reportCategory,
      priority: reportSeverity,
      priorityScore: String(priorityScore),
      description: reportDescription,
      contactNumber: reportPhone,
    });

    try {
      const response = await fetch('/api/emergencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || `Emergency registration failed (${response.status})`);
      }

      const newRequest: CitizenRequest = {
        id: trackingId,
        citizenName,
        locationName: reportLandmark,
        coordinates: [citizenLocation[0], citizenLocation[1]],
        category: reportCategory,
        priority: reportSeverity,
        peopleCount: reportPeopleCount || 1,
        description: reportDescription,
        timestamp: 'Just now',
        status: 'pending',
        contactNumber: reportPhone,
      };
      setCitizenRequests((prev) => [newRequest, ...prev]);
      setIsReportModalOpen(false);
      setReportPhone('');
      setReportLandmark('');
      setReportDescription('');
      showToast(`Emergency saved to database! Tracking ID: ${trackingId}`, 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not connect to GarudaResQ backend.';
      showToast(message, 'alert');
    } finally {
      setIsEmergencySubmitting(false);
    }
  };

  // ==========================================
  // SHARED MAP HELPER: RENDER MARKERS & REAL ROAD LAYERS
  // ==========================================
  const renderMapLayers = (
    map: L.Map,
    mode: 'citizen' | 'ngo' | 'shelter'
  ) => {
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Circle || layer instanceof L.Polyline) {
        map.removeLayer(layer);
      }
    });

    // 1. STRICTLY FIXED GOOGLE MAPS STYLE USER LOCATION BLUE DOT (NO ANIMATION)
    const gmapsUserDotHtml = `
      <div class="gmaps-user-dot-container">
        <div class="gmaps-accuracy-circle"></div>
        <div class="gmaps-blue-dot">
          <div class="gmaps-white-inner"></div>
        </div>
      </div>
    `;
    const userIcon = L.divIcon({
      html: gmapsUserDotHtml,
      className: 'gmaps-user-dot-icon',
      iconSize: [56, 56],
      iconAnchor: [28, 28],
    });

    const userMarker = L.marker(citizenLocation, { icon: userIcon, zIndexOffset: 2000 }).addTo(map);
    if (mode === 'citizen') {
      citizenUserMarkerRef.current = userMarker;
    }
    userMarker.bindPopup(`
      <div class="text-xs p-1">
        <div class="text-blue-400 font-bold uppercase text-[10px] flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-blue-500"></span> Citizen Fixed Location (GPS)
        </div>
        <div class="font-bold text-white text-sm mt-0.5">${locationLabel}</div>
        <div class="text-slate-400 font-mono text-[10px]">${citizenLocation[0].toFixed(5)} N, ${citizenLocation[1].toFixed(5)} E</div>
        <div class="mt-1 text-[10px] font-semibold ${
          locationRiskLevel === 'HIGH' ? 'text-red-400' : locationRiskLevel === 'MODERATE' ? 'text-amber-400' : 'text-emerald-400'
        }">
          Risk Status: ${locationRiskLevel} RISK (${formatDistance(userHazardDistanceKm)} from epicenter)
        </div>
        ${
          activeRouteShelter
            ? `<div class="mt-2 text-[10px] text-cyan-300 font-medium">Safest street route active to ${activeRouteShelter.name}</div>`
            : ''
        }
      </div>
    `);

    // 2. RENDER ALL 10 DEHRADUN SHELTERS
    shelters.forEach((shelter) => {
      const inHazard = isInsideHazardZone(shelter.coordinates);
      const isFull = shelter.status === 'full';
      const isHigh = shelter.status === 'high_occupancy';
      const isManaged = mode === 'shelter' && shelter.id === managedShelterId;
      const isCurrentRouteTarget = activeRouteShelter?.id === shelter.id;

      let badgeBg = 'bg-emerald-500';
      let borderClass = 'border-emerald-500/60';
      let shadowClass = 'shadow-emerald-500/50';

      if (inHazard) {
        badgeBg = 'bg-red-600';
        borderClass = 'border-red-500';
        shadowClass = 'shadow-red-600/70';
      } else if (isCurrentRouteTarget) {
        badgeBg = 'bg-cyan-500 ring-2 ring-white';
        borderClass = 'border-cyan-400';
        shadowClass = 'shadow-cyan-500/90';
      } else if (isManaged) {
        badgeBg = 'bg-cyan-500';
        borderClass = 'border-cyan-400 ring-2 ring-cyan-400';
        shadowClass = 'shadow-cyan-500/80';
      } else if (isFull) {
        badgeBg = 'bg-red-500';
        borderClass = 'border-red-500/60';
        shadowClass = 'shadow-red-500/50';
      } else if (isHigh) {
        badgeBg = 'bg-amber-500';
        borderClass = 'border-amber-500/60';
        shadowClass = 'shadow-amber-500/50';
      }

      const shelterIconHtml = `
        <div class="relative flex items-center justify-center cursor-pointer group">
          <div class="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full ${badgeBg} border-2 border-slate-900 z-10 flex items-center justify-center text-[8px] text-white font-bold">
            ${inHazard ? '!' : isCurrentRouteTarget ? ' ' : isManaged ? ' ' : ''}
          </div>
          <div class="w-10 h-10 rounded-xl bg-slate-900/95 border ${borderClass} shadow-lg ${shadowClass} flex items-center justify-center ${
        inHazard
          ? 'text-red-400'
          : isCurrentRouteTarget
          ? 'text-cyan-300'
          : isManaged
          ? 'text-cyan-300'
          : 'text-emerald-400'
      } group-hover:scale-110 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
        </div>
      `;

      const icon = L.divIcon({
        html: shelterIconHtml,
        className: 'shelter-marker-icon',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      const marker = L.marker(shelter.coordinates, { icon }).addTo(map);
      marker.on('click', () => {
        setStickyShelterCard(shelter);
      });

      const distStr = formatDistance(getDistanceInKm(citizenLocation[0], citizenLocation[1], shelter.coordinates[0], shelter.coordinates[1]));
      const occPercent = Math.round((shelter.currentOccupancy / shelter.totalCapacity) * 100);

      marker.bindPopup(`
        <div class="text-xs p-1 max-w-[270px]">
          <div class="flex items-center justify-between gap-1 border-b border-slate-700 pb-1 mb-1.5">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold ${
              inHazard
                ? 'bg-red-950 text-red-300 border border-red-600 animate-pulse'
                : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
            }">
              ${inHazard ? 'UNSAFE - HAZARD ZONE' : 'OPERATIONAL SAFE'}
            </span>
            <span class="text-cyan-400 font-mono text-[10px] font-bold">${distStr}</span>
          </div>
          <div class="font-bold text-white text-sm">${shelter.name}</div>
          <div class="text-slate-400 text-[11px]">${shelter.locationArea}</div>
          <div class="mt-2 bg-slate-800/80 p-2 rounded-lg border border-slate-700/60">
            <div class="flex justify-between text-[11px] text-slate-300 mb-1">
              <span>Occupancy</span>
              <span class="font-mono text-emerald-400 font-bold">${shelter.currentOccupancy} / ${shelter.totalCapacity} (${occPercent}%)</span>
            </div>
            <div class="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
              <div class="h-full ${inHazard ? 'bg-red-600' : 'bg-emerald-500'}" style="width: ${occPercent}%"></div>
            </div>
          </div>
          <div class="mt-2 text-[10px] text-slate-300 grid grid-cols-2 gap-1">
            <div class="bg-slate-800/50 p-1 rounded">Rations: <b>${shelter.resources.foodPacks}</b></div>
            <div class="bg-slate-800/50 p-1 rounded">Water: <b>${shelter.resources.waterLiters}L</b></div>
          </div>
          <div class="mt-2.5 pt-2 border-t border-slate-700/80">
            ${
              !inHazard
                ? `<button onclick="window.__garudaEvacuate('${shelter.id}')" class="w-full py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer shadow-md">
                     <span>Evacuate to Safe Zone</span>
                   </button>`
                : `<div class="py-1 px-2 rounded bg-red-950 text-red-400 text-center font-bold text-[10px] border border-red-800">
                     Inside Hazard Zone &bull; Routing Disabled
                   </div>`
            }
          </div>
        </div>
      `);
    });

    // 3. NGO & SHELTER VIEWS: INCIDENT DISTRESS MARKERS
    if (mode === 'ngo' || mode === 'shelter') {
      citizenRequests.forEach((req) => {
        const isCritical = req.priority === 'critical';
        const isAcquired = req.status === 'acquired';
        const isDispatched = req.status === 'dispatched';
        const isResolved = req.status === 'resolved';
        const isSelected = selectedNgoRequestId === req.id;

        let pinColor = 'bg-red-600 shadow-red-600/70';
        let ringColor = 'bg-red-500/30';
        let pinText = '!';

        if (isResolved) {
          pinColor = 'bg-slate-600 shadow-slate-600/40';
          ringColor = 'bg-transparent';
          pinText = '✓';
        } else if (isAcquired) {
          pinColor = 'bg-amber-500 shadow-amber-500/80 ring-2 ring-white';
          ringColor = 'bg-amber-500/40';
          pinText = '⚡';
        } else if (isDispatched) {
          pinColor = 'bg-cyan-600 shadow-cyan-600/70';
          ringColor = 'bg-cyan-500/30';
          pinText = '➔';
        }

        const sosIconHtml = `
          <div class="relative flex items-center justify-center cursor-pointer group">
            ${isSelected ? `<div class="sos-focus-ring pointer-events-none"></div>` : ''}
            ${!isResolved ? `<div class="absolute w-10 h-10 rounded-full ${ringColor} radar-pulse pointer-events-none"></div>` : ''}
            <div class="w-8 h-8 rounded-full ${pinColor} border-2 border-white shadow-lg flex items-center justify-center text-white font-black text-xs group-hover:scale-125 transition-transform">
              ${pinText}
            </div>
          </div>
        `;

        const icon = L.divIcon({
          html: sosIconHtml,
          className: 'sos-marker-icon',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker(req.coordinates, { icon }).addTo(map);
        if (mode === 'ngo') {
          ngoMarkersMapRef.current.set(req.id, marker);
        }

        marker.bindPopup(`
          <div class="text-xs p-1 max-w-[260px]">
            <div class="flex items-center justify-between border-b border-slate-700 pb-1 mb-1.5">
              <span class="px-1.5 py-0.5 rounded text-[10px] font-bold ${
                isAcquired
                  ? 'bg-amber-950 text-amber-300 border border-amber-600 font-extrabold'
                  : isCritical
                  ? 'bg-red-950 text-red-300 border border-red-600'
                  : 'bg-slate-800 text-slate-300'
              }">
                ${isAcquired ? '⚡ ACQUIRED BY NGO' : req.priority.toUpperCase()}
              </span>
              <span class="text-[10px] font-mono text-slate-400">${req.id}</span>
            </div>
            <div class="font-bold text-white text-sm">${req.citizenName}</div>
            <div class="text-cyan-400 text-[11px]">${req.locationName} (${req.peopleCount} Affected)</div>
            <p class="text-slate-300 text-[11px] bg-slate-800/80 p-2 rounded mt-1.5">
              "${req.description}"
            </p>
            ${
              req.acquiredBy
                ? `<div class="mt-2 text-[10px] text-amber-300 bg-amber-950/70 p-1.5 rounded border border-amber-800/60 font-semibold">
                     Assigned Unit: ${req.acquiredBy}
                   </div>`
                : ''
            }
            ${
              mode === 'ngo' && !isResolved
                ? `<div class="mt-2.5 pt-2 border-t border-slate-700/80">
                     <button onclick="window.__garudaDeployTeam('${req.id}')" class="w-full py-1.5 px-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] flex items-center justify-center gap-1.5 cursor-pointer shadow-md">
                       <span>Deploy Team / Respond (OSRM)</span>
                     </button>
                   </div>`
                : ''
            }
          </div>
        `);
      });
    }

    // 4. MULTI-ZONE DISASTER HAZARD CIRCLE (1.5 KM RADIUS)
    if (simulation.active) {
      L.circle(simulation.center, {
        color: '#ef4444',
        fillColor: '#dc2626',
        fillOpacity: 0.25,
        weight: 3,
        dashArray: '8, 8',
        radius: simulation.radiusMeters,
      }).addTo(map);

      // Disaster Epicenter Marker
      const hazardIcon = L.divIcon({
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-12 h-12 rounded-full bg-red-600/40 radar-pulse pointer-events-none"></div>
            <div class="w-9 h-9 rounded-full bg-red-600 border-2 border-white shadow-xl shadow-red-700 flex items-center justify-center text-white font-extrabold text-sm">
              !
            </div>
          </div>
        `,
        className: 'hazard-epicenter-icon',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });
      const hazardMarker = L.marker(simulation.center, { icon: hazardIcon, zIndexOffset: 1500 }).addTo(map);
      hazardMarker.bindPopup(`
        <div class="text-xs p-1 max-w-[240px]">
          <div class="text-red-400 font-extrabold text-[10px] uppercase flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-red-500 animate-ping"></span> ACTIVE HAZARD EPICENTER
          </div>
          <div class="font-bold text-white text-sm mt-1">${simulation.hazardName}</div>
          <div class="text-slate-300 text-[11px] mt-1">${simulation.description}</div>
          <div class="mt-2 text-[10px] text-amber-300 font-mono bg-red-950/80 p-1.5 rounded border border-red-800">
            Radius: 1.5 km &bull; Shelters inside flagged UNSAFE
          </div>
        </div>
      `);
    }

    // 5. CITIZEN EVACUATION OSRM ROUTE (Real Dehradun streets, turns, and corridors)
    if (
      mode === 'citizen' &&
      activeSafeRouteTarget &&
      !isInsideHazardZone(activeSafeRouteTarget.coordinates)
    ) {
      const roadPath = currentRouteGeometry?.coordinates || generateDehradunFallbackRoads(citizenLocation, activeSafeRouteTarget.coordinates);

      L.polyline(roadPath, {
        color: '#1e3a8a',
        weight: 9,
        opacity: 0.65,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      L.polyline(roadPath, {
        color: '#00f0ff',
        weight: 4.5,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);
    }

    // 6. REQUIREMENT 2 & 3: NGO TACTICAL DISPATCH REAL-STREET ROUTE (OSRM ROAD NETWORK)
    if (mode === 'ngo') {
      const baseIcon = L.divIcon({
        html: `
          <div class="relative flex items-center justify-center cursor-pointer group">
            <div class="absolute w-12 h-12 rounded-full ${
              isNgoGpsActive ? 'bg-cyan-500/30' : 'bg-amber-500/30'
            } radar-pulse pointer-events-none"></div>
            <div class="w-10 h-10 rounded-2xl ${
              isNgoGpsActive
                ? 'bg-gradient-to-br from-cyan-400 to-blue-600 border-2 border-white shadow-xl shadow-cyan-500/70'
                : 'bg-gradient-to-br from-amber-400 to-amber-600 border-2 border-white shadow-xl shadow-amber-500/70'
            } flex items-center justify-center text-slate-950 font-black group-hover:scale-110 transition-transform">
              ${
                isNgoGpsActive
                  ? `<svg class="w-5 h-5 text-slate-950" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>`
                  : `<svg class="w-5 h-5 text-slate-950" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>`
              }
            </div>
          </div>
        `,
        className: 'ngo-base-marker-icon',
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });
      const baseMarker = L.marker(ngoLocation, { icon: baseIcon, zIndexOffset: 2500 }).addTo(map);
      baseMarker.bindPopup(`
        <div class="text-xs p-1">
          <div class="font-extrabold uppercase text-[10px] flex items-center gap-1.5 ${
            isNgoGpsActive ? 'text-cyan-400' : 'text-amber-400'
          }">
            <span class="w-2 h-2 rounded-full ${isNgoGpsActive ? 'bg-cyan-400 animate-ping' : 'bg-amber-400'}"></span>
            ${isNgoGpsActive ? '🛰️ NGO LIVE GPS FIELD TEAM' : '🏢 NGO TACTICAL STAGING BASE'}
          </div>
          <div class="text-white font-bold text-sm mt-0.5">${ngoLocationLabel}</div>
          <div class="text-slate-400 font-mono text-[10px] mt-0.5">${ngoLocation[0].toFixed(5)} N, ${ngoLocation[1].toFixed(5)} E</div>
          <div class="mt-1 text-[10px] ${isNgoGpsActive ? 'text-cyan-300' : 'text-emerald-400'} font-semibold">
            ${isNgoGpsActive ? 'High-Accuracy Satellite Positioning' : 'Active Fleet Depot & Incident Dispatch Ready'}
          </div>
        </div>
      `);

      if (activeDispatchedIncident) {
        const ngoRoadPath =
          ngoRouteGeometry?.coordinates ||
          generateDehradunFallbackRoads(ngoLocation, activeDispatchedIncident.coordinates);

        // 1. Deep Amber outer casing / glow
        L.polyline(ngoRoadPath, {
          color: '#b45309',
          weight: 10,
          opacity: 0.9,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(map);

        // 2. High-contrast intermediate border outline
        L.polyline(ngoRoadPath, {
          color: '#082f49',
          weight: 7,
          opacity: 0.95,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(map);

        // 3. Vibrant Neon Blue polyline route along real roads
        const routePolyline = L.polyline(ngoRoadPath, {
          color: '#00f0ff',
          weight: 4.5,
          opacity: 1.0,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(map);

        if (ngoRoadPath.length > 0) {
          map.fitBounds(routePolyline.getBounds(), { padding: [50, 50] });
        }
      }
    }
  };

  // ==========================================
  // MAP LIFECYCLE HOOKS
  // ==========================================
  useEffect(() => {
    if (activeView !== 'citizen') return;
    const timer = setTimeout(() => {
      if (!citizenMapContainerRef.current) return;
      if (!citizenMapInstanceRef.current) {
        const map = L.map(citizenMapContainerRef.current, {
          center: citizenLocation,
          zoom: 14,
        });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);
        citizenMapInstanceRef.current = map;
      } else {
        citizenMapInstanceRef.current.invalidateSize();
      }
      renderMapLayers(citizenMapInstanceRef.current, 'citizen');
    }, 120);
    return () => clearTimeout(timer);
  }, [
    activeView,
    shelters,
    citizenRequests,
    simulation,
    citizenLocation,
    activeSafeRouteTarget,
    currentRouteGeometry,
    isCitizenMapFullscreen,
  ]);

  useEffect(() => {
    if (activeView !== 'ngo') return;
    const timer = setTimeout(() => {
      if (!ngoMapContainerRef.current) return;
      if (!ngoMapInstanceRef.current) {
        const map = L.map(ngoMapContainerRef.current, {
          center: ngoLocation,
          zoom: 14,
        });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);
        ngoMapInstanceRef.current = map;
      }
      ngoMapInstanceRef.current.invalidateSize();
      renderMapLayers(ngoMapInstanceRef.current, 'ngo');
      if (activeDispatchedIncident && ngoRouteGeometry?.coordinates && ngoRouteGeometry.coordinates.length > 0) {
        const polyline = L.polyline(ngoRouteGeometry.coordinates);
        ngoMapInstanceRef.current.fitBounds(polyline.getBounds(), { padding: [50, 50] });
      } else {
        ngoMapInstanceRef.current.flyTo(ngoLocation, 14, { animate: true });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [
    activeView,
    shelters,
    citizenRequests,
    simulation,
    isNgoMapFullscreen,
    activeDispatchedIncident,
    selectedNgoRequestId,
    ngoRouteGeometry,
    ngoLocation,
    ngoLocationLabel,
    isNgoGpsActive,
  ]);

  useEffect(() => {
    if (activeView !== 'shelter') return;
    const timer = setTimeout(() => {
      if (!shelterMapContainerRef.current) return;
      if (!shelterMapInstanceRef.current) {
        const map = L.map(shelterMapContainerRef.current, {
          center: managedShelter.coordinates,
          zoom: 13,
        });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);
        shelterMapInstanceRef.current = map;
      } else {
        shelterMapInstanceRef.current.setView(managedShelter.coordinates, 13);
        shelterMapInstanceRef.current.invalidateSize();
      }
      renderMapLayers(shelterMapInstanceRef.current, 'shelter');
    }, 120);
    return () => clearTimeout(timer);
  }, [activeView, shelters, managedShelterId, simulation, isShelterMapFullscreen]);

  // Redraw invalidations across view changes
  useEffect(() => {
    const t1 = setTimeout(() => {
      citizenMapInstanceRef.current?.invalidateSize();
      ngoMapInstanceRef.current?.invalidateSize();
      shelterMapInstanceRef.current?.invalidateSize();
    }, 60);
    const t2 = setTimeout(() => {
      citizenMapInstanceRef.current?.invalidateSize();
      ngoMapInstanceRef.current?.invalidateSize();
      shelterMapInstanceRef.current?.invalidateSize();
    }, 250);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [activeView]);

  // Window callbacks for Leaflet marker popup action buttons
  useEffect(() => {
    (window as any).__garudaDeployTeam = (reqId: string) => {
      const req = citizenRequests.find((r) => r.id === reqId);
      if (req) handleDeployResponseTeam(req);
    };
    (window as any).__garudaEvacuate = (shelterId: string) => {
      const shelter = shelters.find((s) => s.id === shelterId);
      if (shelter) handleStartEvacuation(shelter);
    };
  }, [citizenRequests, shelters, citizenLocation, ngoLocation, ngoLocationLabel, isNgoGpsActive]);

  // SMART DYNAMIC PRIORITY TRIAGE ENGINE (NGO DASHBOARD)
  const triagedRequests = useMemo<TriagedCitizenRequest[]>(() => {
    // 1. Calculate triage scores for each incident based on hazard proximity & affected volume
    const scoredList = citizenRequests.map((req) => {
      let basePriorityPoints = 60;
      if (req.priority === 'critical') basePriorityPoints = 450;
      else if (req.priority === 'high') basePriorityPoints = 280;
      else if (req.priority === 'moderate') basePriorityPoints = 140;

      let categoryBonus = 0;
      if (req.category === 'Medical') categoryBonus = 120;
      else if (req.category === 'Flood') categoryBonus = 100;
      else if (req.category === 'Landslide') categoryBonus = 80;

      // Metric 2: Volume of Affected/Injured People (Higher affected count = higher priority)
      const peopleVolumeBonus = req.peopleCount * 55;

      // Metric 1: Proximity to Active Hazard Center (Inside or close to Red Zone = higher weight)
      let hazardProximityBonus = 0;
      let distToHazardKm = 999;
      let isInsideHazard = false;

      if (simulation.active) {
        distToHazardKm = getDistanceInKm(
          req.coordinates[0],
          req.coordinates[1],
          simulation.center[0],
          simulation.center[1]
        );
        isInsideHazard = distToHazardKm * 1000 <= simulation.radiusMeters;

        if (isInsideHazard) {
          hazardProximityBonus = 650; // Decisive boost for being inside active Red Zone
        } else if (distToHazardKm <= 3.0) {
          hazardProximityBonus = Math.round((3.0 - distToHazardKm) * 120); // Up to 360 pts
        } else if (distToHazardKm <= 6.0) {
          hazardProximityBonus = Math.round((6.0 - distToHazardKm) * 35); // Up to 105 pts
        }
      }

      let statusModifier = 0;
      if (req.status === 'resolved') {
        statusModifier = -10000; // Resolved always sinks to the bottom
      } else if (req.status === 'pending') {
        statusModifier = 60; // Needs immediate attention
      }

      const totalScore = Math.max(
        0,
        basePriorityPoints + categoryBonus + peopleVolumeBonus + hazardProximityBonus + statusModifier
      );

      return {
        req,
        totalScore,
        isInsideHazard,
        distToHazardKm,
        hazardProximityBonus,
      };
    });

    // 2. Automated Dynamic Priority Sorting (Highest score at top)
    scoredList.sort((a, b) => b.totalScore - a.totalScore);

    // 3. Assign sequential Triage Ranks and dynamic visual badges
    let activeRankCounter = 1;
    return scoredList.map((item) => {
      const isResolved = item.req.status === 'resolved';
      const rank = isResolved ? 999 : activeRankCounter++;

      let badgeLabel = '';
      if (isResolved) {
        badgeLabel = 'RESOLVED &bull; SAFE';
      } else if (item.isInsideHazard) {
        badgeLabel = `${item.req.priority.toUpperCase()} #${rank} - INSIDE HAZARD ZONE (${item.req.peopleCount} ${item.req.peopleCount === 1 ? 'PERSON' : 'PEOPLE AFFECTED'})`;
      } else if (item.hazardProximityBonus > 100) {
        badgeLabel = `${item.req.priority.toUpperCase()} #${rank} - PROXIMITY HAZARD ALERT (${item.req.peopleCount} ${item.req.peopleCount === 1 ? 'PERSON' : 'PEOPLE AFFECTED'})`;
      } else if (item.req.peopleCount >= 5) {
        badgeLabel = `${item.req.priority.toUpperCase()} #${rank} - HIGH CASUALTY DENSITY (${item.req.peopleCount} PEOPLE AFFECTED)`;
      } else {
        badgeLabel = `${item.req.priority.toUpperCase()} #${rank} - PRIORITY SCORE: ${item.totalScore} PTS`;
      }

      return {
        ...item.req,
        triageScore: item.totalScore,
        triageRank: rank,
        isInsideHazard: item.isInsideHazard,
        distToHazardKm: item.distToHazardKm,
        triageBadgeLabel: badgeLabel,
      };
    });
  }, [citizenRequests, simulation]);

  // Filtered requests for NGO View (preserves triage ranking order)
  const filteredRequests = useMemo(() => {
    return triagedRequests.filter((req) => {
      if (ngoPriorityFilter !== 'all' && req.priority !== ngoPriorityFilter) return false;
      if (ngoCategoryFilter !== 'all' && req.category !== ngoCategoryFilter) return false;
      if (ngoSearchQuery) {
        const q = ngoSearchQuery.toLowerCase();
        const matchesName = req.citizenName.toLowerCase().includes(q);
        const matchesLoc = req.locationName.toLowerCase().includes(q);
        const matchesDesc = req.description.toLowerCase().includes(q);
        if (!matchesName && !matchesLoc && !matchesDesc) return false;
      }
      return true;
    });
  }, [triagedRequests, ngoPriorityFilter, ngoCategoryFilter, ngoSearchQuery]);

  // Managed shelter stats
  const managedOccupancyRatio = managedShelter.currentOccupancy / managedShelter.totalCapacity;
  const managedOccupancyPercent = Math.round(managedOccupancyRatio * 100);
  const isFoodLow = managedShelter.resources.foodPacks < managedShelter.initialResources.foodPacks * 0.2;
  const isWaterLow = managedShelter.resources.waterLiters < managedShelter.initialResources.waterLiters * 0.2;
  const isMedicalLow = managedShelter.resources.medicalKits < managedShelter.initialResources.medicalKits * 0.2;
  const isBlanketsLow = managedShelter.resources.blankets < managedShelter.initialResources.blankets * 0.2;

  // Global calculations
  const totalBedCapacity = shelters.reduce((acc, s) => acc + s.totalCapacity, 0);
  const currentOccupancy = shelters.reduce((acc, s) => acc + s.currentOccupancy, 0);
  const availableBeds = totalBedCapacity - currentOccupancy;
  const activeSOSCount = citizenRequests.filter((r) => r.status !== 'resolved').length;
  const criticalSOSCount = citizenRequests.filter((r) => r.priority === 'critical' && r.status !== 'resolved').length;

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col font-['Inter',sans-serif] relative selection:bg-emerald-500/30">
      {/* ============================================================== */}
      {/* 1. TOP DISASTER SIMULATION ALERT BANNER WITH SELECTOR DROPDOWN  */}
      {/* ============================================================== */}
      <div
        className={`w-full py-2.5 px-4 transition-colors duration-300 border-b flex flex-wrap items-center justify-between gap-3 text-xs z-30 ${
          simulation.active
            ? 'bg-gradient-to-r from-red-950 via-slate-900 to-red-950 border-red-700/80 text-red-100 shadow-lg'
            : 'bg-slate-900/80 border-slate-800 text-slate-300'
        }`}
      >
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2 font-semibold">
            {simulation.active ? (
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-80"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-600"></span>
              </span>
            ) : (
              <span className="inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            )}
            <span className="tracking-wide uppercase font-['Plus_Jakarta_Sans',sans-serif] font-bold text-xs sm:text-sm">
              {simulation.active ? 'ACTIVE DISASTER RED-ZONE (1.5 KM)' : 'SYSTEM STATUS: MONITORING DEHRADUN'}
            </span>
          </div>
          <span className="text-slate-600 hidden sm:inline">|</span>
          {simulation.active ? (
            <span className="text-xs text-red-200 truncate max-w-xl">
              <span className="font-bold text-red-300">Hazard:</span> {simulation.hazardName}. Shelters inside 1.5 km circle marked{' '}
              <b className="text-red-400 uppercase font-black">UNSAFE - HAZARD ZONE</b>.
            </span>
          ) : (
            <span className="text-xs text-slate-400">
              Normal elevation monitoring. Use dropdown to simulate flood, landslide, or cloudburst events.
            </span>
          )}
        </div>

        {/* MULTIPLE DISASTER LOCATION SIMULATION DROPDOWN */}
        <div className="flex items-center gap-2 ml-auto flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-950/90 border border-slate-700/80 px-2.5 py-1 rounded-xl shadow-inner">
            <Flame className={`w-3.5 h-3.5 ${simulation.active ? 'text-red-400 animate-pulse' : 'text-slate-400'}`} />
            <span className="text-[11px] font-semibold text-slate-300 hidden md:inline">
              Simulate Disaster Location:
            </span>
            <span className="text-[11px] font-semibold text-slate-300 md:hidden">Disaster:</span>
            <select
              value={selectedDisasterKey}
              onChange={(e) => handleDisasterSelect(e.target.value)}
              className={`bg-slate-900 text-xs font-bold py-1 px-2.5 rounded-lg border outline-none cursor-pointer transition-colors ${
                simulation.active
                  ? 'border-red-500 text-red-300 shadow-sm shadow-red-900/60'
                  : 'border-slate-700 text-slate-200'
              }`}
            >
              <option value="none" className="bg-slate-900 text-slate-300">
                1. None (Normal Monitoring)
              </option>
              <option value="clement-town" className="bg-slate-900 text-red-300">
                2. Clement Town Flood
              </option>
              <option value="rajpur" className="bg-slate-900 text-red-300">
                3. Rajpur Road Landslide
              </option>
              <option value="isbt" className="bg-slate-900 text-red-300">
                4. ISBT Waterlogging
              </option>
              <option value="prem-nagar" className="bg-slate-900 text-red-300">
                5. Prem Nagar Flash Flood
              </option>
              <option value="raipur" className="bg-slate-900 text-red-300">
                6. Raipur Cloudburst
              </option>
              <option value="clock-tower" className="bg-slate-900 text-red-300">
                7. Clock Tower Emergency
              </option>
              <option value="parade-ground" className="bg-slate-900 text-red-300">
                8. Parade Ground Severe Inundation
              </option>
              <option value="dalanwala" className="bg-slate-900 text-red-300">
                9. Dalanwala Structural Collapse
              </option>
              <option value="garhi-cantt" className="bg-slate-900 text-red-300">
                10. Garhi Cantt Landslide
              </option>
              <option value="sahastradhara" className="bg-slate-900 text-red-300">
                11. Sahastradhara Road Debris Flow
              </option>
              <option value="random" className="bg-slate-900 text-amber-300">
                12. &#9888; Dynamic Random Location
              </option>
            </select>

            {selectedDisasterKey === 'random' && (
              <button
                type="button"
                onClick={() => handleDisasterSelect('random')}
                className="p-1 rounded-md bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-700 text-[10px] cursor-pointer transition-colors flex items-center gap-1"
                title="Re-spawn at new random coordinates"
              >
                <RefreshCw className="w-3 h-3" />
                <span className="hidden lg:inline text-[9px] font-bold">Re-roll</span>
              </button>
            )}

            {simulation.active && (
              <button
                type="button"
                onClick={() => handleDisasterSelect('none')}
                className="p-1 rounded-md bg-red-950 hover:bg-red-900 text-red-300 border border-red-700 text-[10px] cursor-pointer transition-colors"
                title="Clear Hazard Zone Simulation"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. NAVBAR & HEADER                                             */}
      {/* ============================================================== */}
      <header className="sticky top-0 z-40 bg-[#070d1d]/90 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 py-3 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div
            onClick={() => switchView('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="relative flex items-center justify-center">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 via-cyan-500/20 to-blue-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10 group-hover:border-emerald-400 group-hover:scale-105 transition-all">
                <ShieldAlert className="w-6 h-6 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
              </div>
              <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#070d1d]"></span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-['Plus_Jakarta_Sans',sans-serif] text-xl font-extrabold tracking-tight text-white flex items-center">
                  GARUDA<span className="text-emerald-400">RESQ</span>
                </span>
                <span className="text-[10px] font-mono font-bold tracking-widest px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 uppercase">
                  DEHRADUN
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium tracking-tight">
                Tactical Emergency Response &amp; Citizen Relief Network
              </p>
            </div>
          </div>

          {/* Primary View Switching Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 bg-slate-900/70 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => switchView('home')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeView === 'home'
                  ? 'bg-slate-800 text-white border border-slate-700/80 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Home className="w-3.5 h-3.5 text-emerald-400" />
              <span>Home</span>
            </button>
            <button
              onClick={() => switchView('citizen')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeView === 'citizen'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Citizen Portal</span>
            </button>
            <button
              onClick={() => handleSelectRole('ngo')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeView === 'ngo'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-amber-300 hover:bg-slate-800/40'
              }`}
            >
              <HeartHandshake className="w-3.5 h-3.5 text-amber-400" />
              <span>NGO Command</span>
              {activeSOSCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-red-600 text-white text-[9px] flex items-center justify-center font-bold">
                  {activeSOSCount}
                </span>
              )}
            </button>
            <button
              onClick={() => handleSelectRole('shelter')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeView === 'shelter'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800/40'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Shelter Hub</span>
            </button>
            <button
              onClick={() => switchView('contacts')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeView === 'contacts'
                  ? 'bg-slate-800 text-white border border-slate-700/60 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <PhoneCall className="w-3.5 h-3.5 text-amber-400" />
              <span>Helplines</span>
            </button>
          </nav>

          {/* Right Action: Active Mode Badge & Login */}
          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800">
              <span className="text-[11px] text-slate-400">Role:</span>
              <span className="flex items-center gap-1.5 text-xs font-semibold">
                {currentRole === 'citizen' && (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> Citizen
                  </span>
                )}
                {currentRole === 'ngo' && (
                  <span className="text-amber-400 flex items-center gap-1">
                    <HeartHandshake className="w-3.5 h-3.5" /> NGO Commander
                  </span>
                )}
                {currentRole === 'shelter' && (
                  <span className="text-cyan-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> {authenticatedUser ? authenticatedUser.label : 'Shelter Incharge'}
                  </span>
                )}
              </span>
            </div>

            {authenticatedUser ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/70 hover:bg-red-900/70 border border-red-800/70 text-red-300 text-xs font-medium transition-all cursor-pointer"
                title="Log out back to Home mode"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setTargetAuthRole('shelter');
                  setAuthUsername('shelter_clocktower');
                  setAuthPassword('safe123');
                  setAuthError('');
                  setIsAuthModalOpen(true);
                }}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-700/20 border border-emerald-400/30 transition-all cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Role Switch / Login</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="flex md:hidden items-center justify-around mt-2.5 pt-2 border-t border-slate-800 text-xs">
          <button
            onClick={() => switchView('home')}
            className={`py-1 px-2 rounded font-medium ${activeView === 'home' ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}
          >
            Home
          </button>
          <button
            onClick={() => switchView('citizen')}
            className={`py-1 px-2 rounded font-medium ${activeView === 'citizen' ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}
          >
            Citizen
          </button>
          <button
            onClick={() => handleSelectRole('ngo')}
            className={`py-1 px-2 rounded font-medium flex items-center gap-1 ${
              activeView === 'ngo' ? 'text-amber-400 font-bold' : 'text-slate-400'
            }`}
          >
            NGO
            {activeSOSCount > 0 && (
              <span className="w-3.5 h-3.5 rounded-full bg-red-600 text-white text-[8px] flex items-center justify-center font-bold">
                {activeSOSCount}
              </span>
            )}
          </button>
          <button
            onClick={() => handleSelectRole('shelter')}
            className={`py-1 px-2 rounded font-medium ${activeView === 'shelter' ? 'text-cyan-400 font-bold' : 'text-slate-400'}`}
          >
            Shelter
          </button>
          <button
            onClick={() => switchView('contacts')}
            className={`py-1 px-2 rounded font-medium ${activeView === 'contacts' ? 'text-white font-bold' : 'text-slate-400'}`}
          >
            Helplines
          </button>
        </div>
      </header>

      {/* ============================================================== */}
      {/* DUAL SOS FLOATING PANEL (CALL + QUICK 1-TAP SOS)              */}
      {/* ============================================================== */}
      {activeView === 'citizen' && (
        <div className="fixed bottom-4 sm:bottom-6 left-4 sm:left-6 z-30 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-950/95 backdrop-blur-xl p-2 rounded-2xl border-2 border-red-500/80 shadow-2xl max-w-[calc(100vw-2rem)] sm:max-w-none">
          <a
            href="tel:1070"
            className="flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-red-300 font-bold text-xs border border-red-800/60 shadow transition-all cursor-pointer"
            title="Immediate direct phone dial to SDRF Uttarakhand"
          >
            <PhoneCall className="w-4 h-4 text-amber-400 animate-pulse" />
            <div className="flex flex-col text-left">
              <span className="leading-tight font-['Plus_Jakarta_Sans',sans-serif]">CALL HOTLINE</span>
              <span className="text-[9px] text-slate-400 font-mono">1070 SDRF / 112</span>
            </div>
          </a>
          <button
            onClick={handleInstantSOS}
            className="relative group flex items-center gap-2.5 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-red-700/60 border border-white/30 transition-all cursor-pointer"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
            <Siren className="w-4 h-4 text-white" />
            <div className="flex flex-col text-left">
              <span className="leading-tight font-['Plus_Jakarta_Sans',sans-serif]">QUICK 1-TAP SOS</span>
              <span className="text-[9px] text-red-200 lowercase font-medium">broadcast coordinates</span>
            </div>
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* STICKY SHELTER DETAILS CARD                                    */}
      {/* ============================================================== */}
      {stickyShelterCard && (
        <div className="fixed bottom-24 sm:bottom-6 right-4 sm:right-6 z-40 w-[calc(100vw-2rem)] sm:w-11/12 max-w-sm bg-slate-900/95 backdrop-blur-xl border-2 border-emerald-500/70 p-4 rounded-2xl shadow-2xl animate-in slide-in-from-bottom duration-300">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Live Shelter Telemetry</span>
                <h4 className="text-sm font-bold text-white leading-tight">{stickyShelterCard.name}</h4>
              </div>
            </div>
            <button
              onClick={() => setStickyShelterCard(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-3 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  isInsideHazardZone(stickyShelterCard.coordinates)
                    ? 'bg-red-950 text-red-300 border border-red-600 animate-pulse'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                }`}
              >
                {isInsideHazardZone(stickyShelterCard.coordinates) ? 'UNSAFE - HAZARD ZONE' : 'VERIFIED SAFE CENTER'}
              </span>
              <span className="text-[10px] text-cyan-400 font-mono font-bold">
                {formatDistance(getDistanceInKm(citizenLocation[0], citizenLocation[1], stickyShelterCard.coordinates[0], stickyShelterCard.coordinates[1]))} away
              </span>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                <span>Current Occupancy:</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {stickyShelterCard.currentOccupancy} / {stickyShelterCard.totalCapacity} Beds
                </span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${isInsideHazardZone(stickyShelterCard.coordinates) ? 'bg-red-600' : 'bg-emerald-500'}`}
                  style={{
                    width: `${Math.round((stickyShelterCard.currentOccupancy / stickyShelterCard.totalCapacity) * 100)}%`,
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-300">
              <div className="bg-slate-950 p-1.5 rounded border border-slate-800">Rations: <b>{stickyShelterCard.resources.foodPacks} packs</b></div>
              <div className="bg-slate-950 p-1.5 rounded border border-slate-800">Water: <b>{stickyShelterCard.resources.waterLiters} L</b></div>
              <div className="bg-slate-950 p-1.5 rounded border border-slate-800">First Aid: <b>{stickyShelterCard.resources.medicalKits} kits</b></div>
              <div className="bg-slate-950 p-1.5 rounded border border-slate-800">Power: <b>{stickyShelterCard.resources.generatorPower ? 'Online' : 'Off'}</b></div>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1 text-slate-300">
              <span>Contact: {stickyShelterCard.contactPerson}</span>
              <a href={`tel:${stickyShelterCard.phone}`} className="text-emerald-400 font-bold hover:underline">
                {stickyShelterCard.phone}
              </a>
            </div>

            <div className="pt-2 flex gap-2">
              {!isInsideHazardZone(stickyShelterCard.coordinates) ? (
                <button
                  onClick={() => handleStartEvacuation(stickyShelterCard)}
                  className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/60 cursor-pointer tracking-wide"
                >
                  <Route className="w-4 h-4 text-slate-950" />
                  <span>Evacuate to Safe Zone</span>
                </button>
              ) : (
                <div className="flex-1 py-1.5 px-2 rounded-lg bg-red-950/80 text-red-400 text-center font-bold text-xs border border-red-800">
                  Inside Hazard Zone &bull; Routing Disabled
                </div>
              )}
              <button
                onClick={() => {
                  setManagedShelterId(stickyShelterCard.id);
                  handleSelectRole('shelter');
                }}
                className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span>Manage Hub</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TOAST NOTIFICATION                                             */}
      {/* ============================================================== */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce duration-500 max-w-md">
          <div
            className={`px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border backdrop-blur-md ${
              toastMessage.type === 'alert'
                ? 'bg-red-950/95 text-red-100 border-red-500/50 shadow-red-950/60'
                : toastMessage.type === 'success'
                ? 'bg-emerald-950/95 text-emerald-100 border-emerald-500/50 shadow-emerald-950/60'
                : 'bg-slate-900/95 text-slate-100 border-slate-700 shadow-black/60'
            }`}
          >
            {toastMessage.type === 'alert' && <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />}
            {toastMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
            {toastMessage.type === 'info' && <Info className="w-5 h-5 text-cyan-400 shrink-0" />}
            <span className="text-xs font-medium">{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MAIN VIEWPORT: STRICT ISOLATED VIEW CONTAINERS                 */}
      {/* ============================================================== */}
      <main className="flex-1 flex flex-col">
        {/* ============================================================ */}
        {/* VIEW 1: DEDICATED HOME / LANDING VIEW (#view-home)            */}
        {/* ============================================================ */}
        <div
          id="view-home"
          className={
            activeView === 'home'
              ? 'flex-1 max-w-7xl mx-auto w-full px-4 lg:px-8 py-8 flex flex-col gap-10 animate-in fade-in duration-200'
              : 'hidden'
          }
        >
          {/* HERO SECTION */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-[#0a1122] to-[#030712] border border-slate-800 p-8 md:p-12 shadow-2xl">
            <div className="absolute top-0 right-0 -mt-16 -mr-16 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-1/4 -mb-16 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 max-w-4xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>GarudaResQ &bull; Dynamic Hazard Assessment &bull; OSRM Road Routing</span>
              </div>
              <h1 className="font-['Plus_Jakarta_Sans',sans-serif] text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15]">
                GarudaResQ &mdash; Dehradun Emergency Response &amp; Relief Network
              </h1>
              <p className="mt-5 text-slate-300 text-sm sm:text-base lg:text-lg leading-relaxed max-w-3xl">
                Real-road tactical routing for the Shivalik foothill terrain and monsoon flash flood corridors across Dehradun. 
                Features dynamic location risk evaluation, real OpenStreetMap OSRM driving geometry strictly following city roads, 
                camera tracking, 10 real evacuation centers, and multi-shelter management.
              </p>

              {/* Primary Call-to-Action Buttons */}
              <div className="mt-8 flex flex-wrap items-center gap-3.5">
                <button
                  onClick={() => switchView('citizen')}
                  className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm tracking-wide shadow-xl shadow-emerald-500/25 transition-all cursor-pointer transform hover:-translate-y-0.5"
                >
                  <Users className="w-4 h-4" />
                  <span>Launch Citizen Emergency Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleSelectRole('ngo')}
                  className="flex items-center gap-2 px-5 py-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-amber-600/30 transition-all cursor-pointer"
                >
                  <HeartHandshake className="w-4 h-4" />
                  <span>NGO Tactical Incident Command</span>
                </button>
                <button
                  onClick={() => handleSelectRole('shelter')}
                  className="flex items-center gap-2 px-5 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 font-semibold text-sm transition-all cursor-pointer"
                >
                  <Building2 className="w-4 h-4 text-cyan-400" />
                  <span>Manage 10 Safe Shelters</span>
                </button>
                <button
                  onClick={() => switchView('contacts')}
                  className="flex items-center gap-2 px-4 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800 text-sm transition-all cursor-pointer"
                >
                  <PhoneCall className="w-4 h-4 text-amber-400" />
                  <span>24/7 Helplines (SDRF/DDMA)</span>
                </button>
              </div>
            </div>

            {/* LIVE EMERGENCY ALERT TICKER BAR */}
            <div className="relative z-10 mt-10 pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
                <div className="text-[11px] text-slate-400 font-medium">Safe Shelters Online</div>
                <div className="text-2xl font-extrabold text-emerald-400 font-mono mt-1">
                  {shelters.filter((s) => !isInsideHazardZone(s.coordinates)).length} / {shelters.length}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  {simulation.active ? 'Shelters in 1.5km circle flagged UNSAFE' : 'All 10 centers operational'}
                </div>
              </div>
              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
                <div className="text-[11px] text-slate-400 font-medium">Total Valley Safe Beds</div>
                <div className="text-2xl font-extrabold text-cyan-400 font-mono mt-1">
                  {availableBeds} <span className="text-xs text-slate-400 font-sans">/ {totalBedCapacity}</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">Live Telemetry Synced</div>
              </div>
              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
                <div className="text-[11px] text-slate-400 font-medium">Active Distress Beacons</div>
                <div className="text-2xl font-extrabold text-red-400 font-mono mt-1 flex items-center gap-2">
                  {activeSOSCount}
                  {criticalSOSCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-700 font-sans">
                      {criticalSOSCount} Critical
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">Dehradun sectors monitored</div>
              </div>
              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
                <div className="text-[11px] text-slate-400 font-medium">Current Citizen Risk</div>
                <div className={`text-2xl font-extrabold font-mono mt-1 ${
                  locationRiskLevel === 'HIGH' ? 'text-red-400' : locationRiskLevel === 'MODERATE' ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {locationRiskLevel} RISK
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  {formatDistance(userHazardDistanceKm)} to epicenter
                </div>
              </div>
            </div>
          </div>

          {/* 3 DISTINCT ROLE ACCESS CARDS */}
          <div>
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-bold font-['Plus_Jakarta_Sans',sans-serif] text-white">
                Mission Portals: Select Your Operating Mode
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Each role provides a completely isolated dashboard with specialized toolsets and dedicated Leaflet maps.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* ROLE CARD 1: CITIZEN PORTAL */}
              <div className="group relative bg-[#0b1329]/90 backdrop-blur-md rounded-3xl p-7 border-2 border-emerald-500/40 hover:border-emerald-400 transition-all duration-300 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/20">
                      <Users className="w-6 h-6" />
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-950/90 text-emerald-300 border border-emerald-600/50">
                      Direct Access &bull; No Login
                    </span>
                  </div>
                  <h3 className="font-['Plus_Jakarta_Sans',sans-serif] text-xl font-bold text-white group-hover:text-emerald-300 transition-colors">
                    Citizen Emergency Portal
                  </h3>
                  <p className="text-xs text-slate-300 mt-2.5 leading-relaxed">
                    Instant emergency navigation for citizens in Dehradun. Features real-time Location Risk Assessment, 
                    smooth camera tracking to your location, real OSRM street navigation, and 10 safe shelters.
                  </p>
                  <div className="mt-5 space-y-2 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Dynamic Location Risk Assessment Block (High/Moderate/Safe)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Smooth camera tracking &amp; auto-pan to your location</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Strict road navigation line via OpenStreetMap OSRM API</span>
                    </div>
                  </div>
                </div>
                <div className="mt-8 pt-5 border-t border-slate-800">
                  <button
                    onClick={() => switchView('citizen')}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs tracking-wider uppercase shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span>Enter Citizen Emergency Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* ROLE CARD 2: NGO RELIEF COMMAND */}
              <div className="group relative bg-[#0f172a]/90 backdrop-blur-md rounded-3xl p-7 border border-amber-500/30 hover:border-amber-400/80 transition-all duration-300 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/20">
                      <HeartHandshake className="w-6 h-6" />
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-950/90 text-amber-300 border border-amber-600/50 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> NGO Access
                    </span>
                  </div>
                  <h3 className="font-['Plus_Jakarta_Sans',sans-serif] text-xl font-bold text-white group-hover:text-amber-300 transition-colors">
                    NGO Relief Operations
                  </h3>
                  <p className="text-xs text-slate-300 mt-2.5 leading-relaxed">
                    Tactical incident triage command with real OSRM road response routing directly connecting Police Lines Depot to victim distress coordinates.
                  </p>
                  <div className="mt-5 space-y-2 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Real-street OSRM road response routing to distress incidents</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Live distance &amp; ETA calculation from Police Lines Command Base</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Incident Acquisition Lock &amp; team en route tracking</span>
                    </div>
                  </div>
                </div>
                <div className="mt-8 pt-5 border-t border-slate-800">
                  <button
                    onClick={() => handleSelectRole('ngo')}
                    className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs tracking-wider uppercase shadow-lg shadow-amber-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span>Access NGO Tactical Command</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* ROLE CARD 3: SHELTER INCHARGE HUB */}
              <div className="group relative bg-[#0b162c]/90 backdrop-blur-md rounded-3xl p-7 border border-cyan-500/30 hover:border-cyan-400/80 transition-all duration-300 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/20">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-cyan-950/90 text-cyan-300 border border-cyan-600/50 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Multi-Shelter Auth
                    </span>
                  </div>
                  <h3 className="font-['Plus_Jakarta_Sans',sans-serif] text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                    Shelter Incharge Hub
                  </h3>
                  <p className="text-xs text-slate-300 mt-2.5 leading-relaxed">
                    Logistics command for managing 10 district evacuation centers with multi-shelter authentication (Clock Tower, Parade Ground, ISBT, Clement Town) and isolated facility control.
                  </p>
                  <div className="mt-5 space-y-2 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>Multi-facility credentials for Clock Tower, Parade, ISBT &amp; Clement Town</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>Isolated controls for bed occupancy, capacity steppers &amp; rations</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>Real-time global synchronization across maps and popups</span>
                    </div>
                  </div>
                </div>
                <div className="mt-8 pt-5 border-t border-slate-800">
                  <button
                    onClick={() => handleSelectRole('shelter')}
                    className="w-full py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs tracking-wider uppercase shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span>Access Shelter Management Hub</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* VIEW 2: CITIZEN VIEW CONTAINER (#view-citizen)                */}
        {/* ============================================================ */}
        <div
          id="view-citizen"
          className={
            activeView === 'citizen' ? 'flex-1 flex flex-col w-full animate-in fade-in duration-200' : 'hidden'
          }
        >
          {/* Top Toolbar */}
          <div className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-2.5 z-20 flex flex-wrap items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={handleUseLiveGPS}
                disabled={isGpsLocating}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold shadow-md shadow-cyan-600/30 transition-all cursor-pointer"
              >
                <LocateFixed className={`w-3.5 h-3.5 ${isGpsLocating ? 'animate-spin' : ''}`} />
                <span>{isGpsLocating ? 'Acquiring GPS...' : 'Use My Live GPS Location'}</span>
              </button>
              <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-xs">
                <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="text-slate-400 hidden sm:inline">Citizen Fixed Point:</span>
                <select
                  value={PRESET_ZONES.find((z) => z.name === locationLabel)?.id || ''}
                  onChange={(e) => handleSelectPresetZone(e.target.value)}
                  className="bg-transparent text-white font-semibold outline-none cursor-pointer text-xs"
                >
                  <option value="" disabled className="bg-slate-900 text-slate-400">
                    Select Preset Dehradun Zone...
                  </option>
                  {PRESET_ZONES.map((zone) => (
                    <option key={zone.id} value={zone.id} className="bg-slate-900 text-slate-200">
                      {zone.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsDualSosModalOpen(true)}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-black tracking-wide shadow-lg shadow-red-700/40 animate-pulse transition-all cursor-pointer"
              >
                <Siren className="w-3.5 h-3.5 text-white" />
                <span>EMERGENCY SOS</span>
              </button>
              <button
                onClick={() => setIsReportModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950 hover:bg-red-900 border border-red-700 text-red-200 text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
                <span>Report Detailed Emergency</span>
              </button>
            </div>
          </div>

          {/* ============================================================== */}
          {/* REQUIREMENT 1: DYNAMIC LOCATION RISK ASSESSMENT BLOCK          */}
          {/* ============================================================== */}
          <div className="px-4 lg:px-8 py-3 bg-[#050b18] border-b border-slate-800/80">
            <div
              className={`rounded-2xl p-4 md:p-5 border-2 shadow-2xl transition-all duration-300 relative overflow-hidden flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 ${
                locationRiskLevel === 'HIGH'
                  ? 'bg-gradient-to-r from-red-950/95 via-[#1a0808]/95 to-slate-950/95 border-red-500/80 shadow-red-950/70'
                  : locationRiskLevel === 'MODERATE'
                  ? 'bg-gradient-to-r from-amber-950/90 via-[#181106]/95 to-slate-950/95 border-amber-500/80 shadow-amber-950/60'
                  : 'bg-gradient-to-r from-emerald-950/80 via-[#071714]/95 to-slate-950/95 border-emerald-500/60 shadow-emerald-950/50'
              }`}
            >
              {/* Subtle Ambient Back-glow */}
              <div
                className={`absolute -right-16 -top-16 w-60 h-60 rounded-full blur-3xl pointer-events-none opacity-20 ${
                  locationRiskLevel === 'HIGH' ? 'bg-red-500' : locationRiskLevel === 'MODERATE' ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
              />

              {/* Left Details Block */}
              <div className="relative z-10 flex items-start gap-3.5 flex-1">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border-2 shadow-lg ${
                    locationRiskLevel === 'HIGH'
                      ? 'bg-red-600/30 border-red-500 text-red-400 shadow-red-950/60 animate-pulse'
                      : locationRiskLevel === 'MODERATE'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-amber-950/60'
                      : 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-emerald-950/60'
                  }`}
                >
                  {locationRiskLevel === 'HIGH' ? (
                    <ShieldAlert className="w-7 h-7 text-red-400" />
                  ) : locationRiskLevel === 'MODERATE' ? (
                    <AlertTriangle className="w-7 h-7 text-amber-300" />
                  ) : (
                    <ShieldCheck className="w-7 h-7 text-emerald-400" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-wider border flex items-center gap-1.5 ${
                        locationRiskLevel === 'HIGH'
                          ? 'bg-red-950 text-red-200 border-red-600 animate-pulse'
                          : locationRiskLevel === 'MODERATE'
                          ? 'bg-amber-950 text-amber-200 border-amber-600'
                          : 'bg-emerald-950 text-emerald-300 border-emerald-600'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          locationRiskLevel === 'HIGH'
                            ? 'bg-red-400 animate-ping'
                            : locationRiskLevel === 'MODERATE'
                            ? 'bg-amber-400'
                            : 'bg-emerald-400'
                        }`}
                      />
                      LOCAL HAZARD ASSESSMENT: {locationRiskLevel} RISK
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      Citizen Point: <b className="text-white">{locationLabel}</b>
                    </span>
                  </div>

                  <h3
                    className={`text-sm sm:text-base font-black mt-1.5 tracking-tight font-['Plus_Jakarta_Sans',sans-serif] ${
                      locationRiskLevel === 'HIGH'
                        ? 'text-red-300'
                        : locationRiskLevel === 'MODERATE'
                        ? 'text-amber-200'
                        : 'text-emerald-300'
                    }`}
                  >
                    {locationRiskLevel === 'HIGH' && 'CRITICAL HAZARD DETECTED IN YOUR IMMEDIATE ZONE. EVACUATE NOW.'}
                    {locationRiskLevel === 'MODERATE' && 'DISASTER REPORTED IN NEARBY AREA. STAY ALERT & PREPARE FOR EVACUATION.'}
                    {locationRiskLevel === 'LOW' && 'ZONE CURRENTLY SAFE. NO IMMEDIATE THREAT DETECTED.'}
                  </h3>

                  <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-300 flex-wrap font-mono">
                    {simulation.active ? (
                      <>
                        <span className="flex items-center gap-1">
                          <span className="text-slate-400">Distance to Nearest Hazard:</span>{' '}
                          <b
                            className={`font-bold ${
                              locationRiskLevel === 'HIGH'
                                ? 'text-red-400'
                                : locationRiskLevel === 'MODERATE'
                                ? 'text-amber-400'
                                : 'text-emerald-400'
                            }`}
                          >
                            {formatDistance(userHazardDistanceKm)}
                          </b>
                        </span>
                        <span className="text-slate-600 hidden sm:inline">&bull;</span>
                        <span className="text-slate-300 truncate max-w-sm">
                          Hazard: <span className="text-white font-sans font-medium">{simulation.hazardName}</span>
                        </span>
                      </>
                    ) : (
                      <span className="text-slate-400 font-sans">
                        All Dehradun sectors operating under normal stable elevation conditions.
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right CTA Button / Normal Status Badge */}
              <div className="relative z-10 flex items-center gap-2.5 shrink-0">
                {locationRiskLevel === 'LOW' ? (
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 text-xs font-semibold shadow-inner">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Normal Operations &bull; No Evacuation Needed</span>
                  </div>
                ) : nearestSafeShelter ? (
                  <button
                    onClick={() => handleStartEvacuation(nearestSafeShelter)}
                    className={`w-full md:w-auto px-5 py-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0 ${
                      locationRiskLevel === 'HIGH'
                        ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-red-700/50 border border-red-400'
                        : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-600/40 border border-amber-300'
                    }`}
                  >
                    <Route className="w-4 h-4" />
                    <span>Find Safest Evacuation Route</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <div className="px-3 py-2 rounded-xl bg-red-950 text-red-300 border border-red-700 text-xs font-bold">
                    No Safe Centers in Immediate Vicinity
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Interactive Leaflet Map for Citizen with FULLSCREEN TOGGLE & FLOATING ROUTE BANNER */}
          <div
            className={`relative w-full transition-all duration-300 ${
              isCitizenMapFullscreen
                ? 'fixed inset-0 z-50 w-screen h-screen bg-[#030712] flex flex-col'
                : 'h-[60vh] min-h-[420px]'
            }`}
          >
            {/* Fullscreen Map Toggle Button */}
            <button
              onClick={() => toggleMapFullscreen('citizen')}
              className="absolute top-4 right-4 z-30 p-2.5 rounded-xl bg-slate-900/95 hover:bg-slate-800 text-white border border-slate-700 shadow-2xl flex items-center gap-1.5 text-xs font-semibold backdrop-blur-md cursor-pointer transition-transform active:scale-95"
              title={isCitizenMapFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen Map'}
            >
              {isCitizenMapFullscreen ? (
                <>
                  <Minimize2 className="w-4 h-4 text-cyan-400" />
                  <span className="hidden sm:inline">Exit Fullscreen</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-4 h-4 text-cyan-400" />
                  <span className="hidden sm:inline">Fullscreen Map</span>
                </>
              )}
            </button>

            {/* Quick Camera Reset Button */}
            <button
              onClick={() => flyCameraToUser(citizenLocation)}
              className="absolute top-4 right-32 z-30 p-2.5 rounded-xl bg-slate-900/95 hover:bg-slate-800 text-cyan-300 border border-slate-700 shadow-2xl flex items-center gap-1.5 text-xs font-semibold backdrop-blur-md cursor-pointer transition-transform active:scale-95"
              title="Center Camera on My Position"
            >
              <Crosshair className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">Recenter Map</span>
            </button>

            {/* REAL-ROAD OSRM STREET NAVIGATION BANNER */}
            {activeRouteShelter && !isInsideHazardZone(activeRouteShelter.coordinates) && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 w-11/12 max-w-2xl bg-slate-950/95 backdrop-blur-xl px-4 py-3 rounded-2xl border-2 border-cyan-400 shadow-2xl flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 text-xs animate-in slide-in-from-top duration-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center text-cyan-300 shrink-0 shadow-lg shadow-cyan-500/30">
                    <Navigation className="w-5 h-5 text-cyan-300" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300 font-extrabold flex items-center gap-1.5 bg-cyan-950/90 px-2 py-0.5 rounded border border-cyan-700">
                        <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                        STREET EVACUATION ROUTE &bull; {activeRouteShelter.name.toUpperCase()}
                      </span>
                      {isRouteCalculating && (
                        <span className="text-[10px] text-amber-300 font-mono flex items-center gap-1 animate-pulse">
                          <RotateCw className="w-3 h-3 animate-spin" /> Routing...
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-slate-300 mt-1 flex-wrap text-xs font-mono">
                      <span className="text-cyan-300 font-bold">
                        STREET DISTANCE: <span className="text-white font-extrabold">{formatDistance(routeDistanceKm)}</span>
                      </span>
                      <span className="text-slate-600 hidden sm:inline">&bull;</span>
                      <span className="text-emerald-400 font-bold">
                        ~{driveTimeMins} MIN DRIVE
                      </span>
                      <span className="text-slate-600 hidden md:inline">&bull;</span>
                      <span className="text-slate-400 text-[11px] hidden md:inline">
                        ~{walkTimeMins} min walk (OSRM Street Network)
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleStopNavigation}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-black text-xs transition-all shadow-lg shadow-red-700/50 cursor-pointer shrink-0 ml-auto border border-red-400/40"
                  title="Stop Navigation"
                >
                  <X className="w-4 h-4 text-white" />
                  <span>STOP ROUTE</span>
                </button>
              </div>
            )}

            {/* Leaflet Map Canvas */}
            <div id="citizen-map" ref={citizenMapContainerRef} className="w-full h-full z-10" />

            {/* Map Legend Overlay */}
            <div className="absolute top-4 left-4 z-20 max-w-xs bg-slate-950/90 backdrop-blur-md p-3 rounded-xl border border-slate-800 shadow-xl pointer-events-auto">
              <div className="text-xs font-bold text-white mb-1.5 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Dehradun GIS Road Layer</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">OSM / OSRM</span>
              </div>
              <div className="space-y-1.5 text-[10px] text-slate-300">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500 border border-white"></div>
                  <span>Citizen Fixed GPS Point (Fixed blue dot)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-emerald-500"></div>
                  <span>Safe Operational Shelter (10 Locations)</span>
                </div>
                {simulation.active && (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-red-600"></div>
                    <span className="text-red-400 font-bold">Unsafe (Inside 1.5 km Hazard Zone)</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-5 h-1.5 bg-[#00f0ff] rounded shadow-[0_0_8px_#00f0ff]"></div>
                  <span className="text-cyan-300 font-semibold">Neon Blue Street Routing Line (Real Roads)</span>
                </div>
              </div>
            </div>

            {/* Quick 1-Tap SOS Beacon Button on Map */}
            <button
              type="button"
              onClick={() => setIsDualSosModalOpen(true)}
              className="absolute bottom-6 right-6 z-30 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-black text-xs shadow-2xl shadow-red-950/80 border-2 border-red-400/80 backdrop-blur-md cursor-pointer transition-transform hover:scale-105 active:scale-95 group tracking-wider"
            >
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-90"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
              </div>
              <Siren className="w-4 h-4 text-white group-hover:rotate-12 transition-transform" />
              <span>QUICK SOS / RESCUE</span>
            </button>
          </div>

          {/* Citizen Shelters & Quick Access List (10 Locations) */}
          <div className="p-4 lg:p-6 max-w-7xl mx-auto w-full">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white font-['Plus_Jakarta_Sans',sans-serif] flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <span>Dehradun Safe Shelters (10 Real Locations) &amp; Live Capacity</span>
              </h3>
              <span className="text-xs font-mono text-cyan-400">
                {availableBeds} total safe beds available in valley
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
              {shelters.map((shelter) => {
                const inHazard = isInsideHazardZone(shelter.coordinates);
                const dist = getDistanceInKm(citizenLocation[0], citizenLocation[1], shelter.coordinates[0], shelter.coordinates[1]);
                const formattedDist = formatDistance(dist);
                const isNearest = nearestSafeShelter?.id === shelter.id;
                const isCurrentTarget = activeRouteShelter?.id === shelter.id;

                return (
                  <div
                    key={shelter.id}
                    className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                      inHazard
                        ? 'bg-red-950/20 border-red-700/60'
                        : isCurrentTarget
                        ? 'bg-cyan-950/40 border-2 border-cyan-400 shadow-xl shadow-cyan-950/50'
                        : isNearest
                        ? 'bg-emerald-950/30 border-emerald-500 shadow-lg shadow-emerald-950/40'
                        : 'bg-slate-900/60 border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            inHazard
                              ? 'bg-red-950 text-red-300 border border-red-700 animate-pulse'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                          }`}
                        >
                          {inHazard ? 'UNSAFE - HAZARD ZONE' : 'OPERATIONAL SAFE'}
                        </span>
                        <span className="text-xs font-mono font-bold text-cyan-400">{formattedDist}</span>
                      </div>

                      <h4 className="text-xs font-bold text-white flex items-center justify-between leading-snug">
                        <span>{shelter.name}</span>
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">{shelter.locationArea}</p>

                      <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-300">
                        <span>Vacancy:</span>
                        <span className="font-mono text-emerald-400 font-bold">
                          {shelter.totalCapacity - shelter.currentOccupancy} Beds Free
                        </span>
                      </div>

                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {(shelter.facilities || []).slice(0, 2).map((fac) => (
                          <span key={fac} className="px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-300 text-[9px]">
                            {fac}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between gap-1.5">
                      <button
                        onClick={() => setStickyShelterCard(shelter)}
                        className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 font-medium cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Inspect</span>
                      </button>

                      {inHazard ? (
                        <span className="text-[10px] text-red-400 font-medium">Inside Hazard</span>
                      ) : (
                        <button
                          onClick={() => handleStartEvacuation(shelter)}
                          className={`px-2.5 py-1 rounded-lg font-black text-[11px] flex items-center gap-1 shadow-sm cursor-pointer transition-all ${
                            isCurrentTarget
                              ? 'bg-cyan-400 text-slate-950 ring-2 ring-cyan-300'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-700/30'
                          }`}
                        >
                          <Route className="w-3 h-3" />
                          <span>{isCurrentTarget ? 'Navigating' : 'Evacuate'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* VIEW 3: NGO COMMAND DASHBOARD VIEW (#view-ngo)               */}
        {/* ============================================================ */}
        <div
          id="view-ngo"
          className={
            activeView === 'ngo' ? 'flex-1 flex flex-col w-full animate-in fade-in duration-200' : 'hidden'
          }
        >
          {/* Command Header & Live GPS / Base Positioning Bar */}
          <div className="bg-slate-900/95 border-b border-slate-800 px-4 py-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-lg">
            {/* Title & Live Status */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <HeartHandshake className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm sm:text-base font-bold font-['Plus_Jakarta_Sans',sans-serif] text-white">
                    NGO Tactical Incident Command &amp; Triage Center
                  </h2>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border flex items-center gap-1 ${
                      isNgoGpsActive
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-500 animate-pulse'
                        : 'bg-amber-950 text-amber-300 border-amber-600'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${isNgoGpsActive ? 'bg-cyan-400 animate-ping' : 'bg-amber-400'}`}
                    />
                    {isNgoGpsActive ? 'LIVE GPS SATELLITE LOCKED' : 'COMMAND BASE ACTIVE'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 flex-wrap">
                  <span className="text-slate-400">Response Origin:</span>
                  <span className={`font-semibold ${isNgoGpsActive ? 'text-cyan-300' : 'text-slate-200'}`}>
                    {ngoLocationLabel}
                  </span>
                  <span className="text-slate-600">&bull;</span>
                  <span className="font-mono text-[10px] text-slate-400">
                    [{ngoLocation[0].toFixed(5)} N, {ngoLocation[1].toFixed(5)} E]
                  </span>
                </div>
              </div>
            </div>

            {/* NGO Live GPS & Base Location Controls + Triage Stats */}
            <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
              {/* Preset Base Dropdown */}
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-700/80 rounded-xl px-2.5 py-1.5 shadow-inner">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-[11px] text-slate-300 font-semibold hidden sm:inline">Base Post:</span>
                <select
                  value={selectedNgoBaseId}
                  onChange={(e) => handleSelectNgoBase(e.target.value)}
                  className="bg-slate-900 text-xs font-bold text-amber-300 outline-none cursor-pointer border border-slate-700 rounded-lg py-1 px-2 max-w-[210px] truncate"
                >
                  {isNgoGpsActive && (
                    <option value="live-gps" className="bg-slate-900 text-cyan-300">
                      &#128752; Live GPS Field Unit
                    </option>
                  )}
                  {ngoPresetBases.map((b) => (
                    <option key={b.id} value={b.id} className="bg-slate-900 text-slate-200">
                      {b.shortLabel}
                    </option>
                  ))}
                </select>
              </div>

              {/* Use NGO Live GPS Location Button */}
              <button
                type="button"
                onClick={handleUseNgoLiveGPS}
                disabled={isFetchingNgoGps}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
                  isNgoGpsActive
                    ? 'bg-cyan-500 text-slate-950 border border-cyan-300 shadow-cyan-500/25 ring-2 ring-cyan-400/50'
                    : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/40 hover:border-cyan-400'
                }`}
                title="Acquire live GPS coordinates and auto-center camera on NGO team"
              >
                {isFetchingNgoGps ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                ) : (
                  <Navigation className={`w-3.5 h-3.5 ${isNgoGpsActive ? 'text-slate-950' : 'text-cyan-400'}`} />
                )}
                <span>{isNgoGpsActive ? 'Live GPS Active' : 'Use NGO Live GPS Location'}</span>
              </button>

              {/* Camera Centering / FlyTo Trigger Button */}
              <button
                type="button"
                onClick={() => flyNgoCamera(ngoLocation, 15)}
                className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium cursor-pointer transition-all shadow-sm flex items-center gap-1"
                title="Auto-center camera on NGO Unit"
              >
                <Crosshair className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden xl:inline text-[11px]">Center Unit</span>
              </button>

              {/* Triage Stats Ticker */}
              <div className="flex items-center gap-1.5 text-xs ml-auto sm:ml-0">
                <span className="px-2 py-1 rounded-lg bg-red-950 text-red-300 border border-red-700 font-bold font-mono text-[11px]">
                  {citizenRequests.filter((r) => r.status === 'pending').length} Pending
                </span>
                <span className="px-2 py-1 rounded-lg bg-amber-950 text-amber-300 border border-amber-700 font-bold font-mono text-[11px]">
                  {citizenRequests.filter((r) => r.status === 'acquired').length} Acquired
                </span>
                <span className="px-2 py-1 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold font-mono text-[11px]">
                  {citizenRequests.filter((r) => r.status === 'resolved').length} Resolved
                </span>
              </div>
            </div>
          </div>

          {/* Split-Screen Desktop Design: Left Map | Right Triage Queue */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-160px)]">
            {/* Left Column: Dedicated Interactive Command Map (7 cols) with FULLSCREEN TOGGLE */}
            <div
              className={`lg:col-span-7 relative border-r border-slate-800 transition-all duration-300 ${
                isNgoMapFullscreen
                  ? 'fixed inset-0 z-50 w-screen h-screen bg-[#030712] flex flex-col'
                  : 'h-[50vh] lg:h-auto'
              }`}
            >
              {/* Fullscreen Map Toggle Button */}
              <button
                onClick={() => toggleMapFullscreen('ngo')}
                className="absolute top-4 right-4 z-30 p-2.5 rounded-xl bg-slate-900/95 hover:bg-slate-800 text-white border border-slate-700 shadow-2xl flex items-center gap-1.5 text-xs font-semibold backdrop-blur-md cursor-pointer transition-transform active:scale-95"
                title={isNgoMapFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen Map'}
              >
                {isNgoMapFullscreen ? (
                  <>
                    <Minimize2 className="w-4 h-4 text-amber-400" />
                    <span className="hidden sm:inline">Exit Fullscreen</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-4 h-4 text-amber-400" />
                    <span className="hidden sm:inline">Fullscreen Map</span>
                  </>
                )}
              </button>

              {/* REQUIREMENT 2: SLEEK TACTICAL RESPONSE OVERLAY CARD: DYNAMIC NGO-TO-VICTIM DISPATCH */}
              {activeDispatchedIncident && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 w-11/12 max-w-xl bg-slate-950/95 backdrop-blur-xl px-4 py-3 rounded-2xl border-2 border-cyan-400 shadow-2xl shadow-cyan-950/70 flex items-center justify-between gap-3 text-xs animate-in slide-in-from-top duration-200 ring-1 ring-amber-500/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-amber-500/20 border-2 border-cyan-400/70 flex items-center justify-center text-cyan-300 shrink-0 shadow-lg shadow-cyan-500/30">
                      <Truck className="w-5 h-5 text-cyan-400 animate-bounce" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300 font-extrabold flex items-center gap-1.5 bg-cyan-950/90 px-2 py-0.5 rounded border border-cyan-500 shadow-sm">
                          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                          DISPATCH EN ROUTE &bull; {activeDispatchedIncident.id}
                        </span>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-600 font-bold">
                          OSRM STREET NETWORK
                        </span>
                        {isNgoRouteCalculating && (
                          <span className="text-[10px] text-cyan-300 font-mono flex items-center gap-1">
                            <RotateCw className="w-3 h-3 animate-spin" /> Tracing Real Road...
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-300 mt-1 flex items-center gap-1.5 flex-wrap">
                        <span className="text-slate-400">From:</span>
                        <span className="text-white font-medium truncate max-w-[150px]">{ngoLocationLabel}</span>
                        <ArrowRight className="w-3 h-3 text-cyan-400" />
                        <span className="text-slate-400">To:</span>
                        <span className="text-white font-medium truncate max-w-[150px]">{activeDispatchedIncident.locationName}</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-slate-300 mt-1 flex-wrap font-mono text-[11px]">
                        <span className="text-cyan-300 font-bold">
                          ROAD DISTANCE:{' '}
                          {formatDistance(
                            ngoRouteGeometry
                              ? ngoRouteGeometry.distanceKm
                              : getDistanceInKm(
                                  ngoLocation[0],
                                  ngoLocation[1],
                                  activeDispatchedIncident.coordinates[0],
                                  activeDispatchedIncident.coordinates[1]
                                )
                          )}
                        </span>
                        <span className="text-slate-600">|</span>
                        <span className="text-emerald-400 font-bold">
                          EST. ETA:{' '}
                          {ngoRouteGeometry
                            ? ngoRouteGeometry.durationMins
                            : Math.max(
                                2,
                                Math.round(
                                  (getDistanceInKm(
                                    ngoLocation[0],
                                    ngoLocation[1],
                                    activeDispatchedIncident.coordinates[0],
                                    activeDispatchedIncident.coordinates[1]
                                  ) /
                                    35) *
                                    60
                                )
                              )}{' '}
                          MINS
                        </span>
                        <span className="text-slate-600 hidden sm:inline">|</span>
                        <span className="text-amber-300 font-bold hidden sm:inline">
                          {activeDispatchedIncident.peopleCount} Affected
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => {
                        if (ngoMapInstanceRef.current && activeDispatchedIncident) {
                          ngoMapInstanceRef.current.fitBounds([ngoLocation, activeDispatchedIncident.coordinates], {
                            padding: [75, 75],
                            maxZoom: 15,
                          });
                        }
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-600/50 text-[10px] cursor-pointer"
                      title="Fit route bounds on map"
                    >
                      <Crosshair className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleResolveIncident(activeDispatchedIncident.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow flex items-center gap-1 cursor-pointer"
                      title="Mark incident resolved and safe"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Mark Safe</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveDispatchedIncident(null);
                        setNgoRouteGeometry(null);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Cancel Dispatch Route"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              <div id="ngo-map" ref={ngoMapContainerRef} className="w-full h-full z-10" />

              <div className="absolute top-4 left-4 z-20 bg-slate-950/90 backdrop-blur-md p-3 rounded-xl border border-slate-800 shadow-xl text-[10px] space-y-1 text-slate-300">
                <div className="font-bold text-white text-xs mb-1">Command Map Pins</div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 border border-white"></span>
                  <span className="text-cyan-300 font-bold">NGO Unit ({isNgoGpsActive ? 'Live GPS' : 'Command Base'})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
                  <span>Pending Victim Beacon (Unassigned)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-600"></span>
                  <span className="text-cyan-300 font-bold">Team Dispatched / En Route</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span className="text-amber-300 font-bold">Acquired Incident</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-600"></span>
                  <span>Resolved &amp; Safe</span>
                </div>
              </div>
            </div>

            {/* Right Column: Distress Request Triage Queue (5 cols) */}
            <div className="lg:col-span-5 bg-[#070d1d] flex flex-col h-[50vh] lg:h-auto overflow-hidden">
              {/* Filter and Search Bar */}
              <div className="p-3.5 border-b border-slate-800 bg-slate-900/60 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={ngoSearchQuery}
                      onChange={(e) => setNgoSearchQuery(e.target.value)}
                      placeholder="Search victims, areas, landmarks..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 px-1">Urgency:</span>
                    {['all', 'critical', 'high', 'moderate'].map((u) => (
                      <button
                        key={u}
                        onClick={() => setNgoPriorityFilter(u)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize transition-all ${
                          ngoPriorityFilter === u
                            ? 'bg-amber-500 text-slate-950 shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                  <select
                    value={ngoCategoryFilter}
                    onChange={(e) => setNgoCategoryFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-slate-300 text-[10px] font-medium py-1 px-2 rounded-lg outline-none"
                  >
                    <option value="all">All Categories</option>
                    <option value="Flood">Flood</option>
                    <option value="Landslide">Landslide</option>
                    <option value="Medical">Medical</option>
                    <option value="Structural Damage">Structural</option>
                  </select>
                </div>
                <div className="flex items-center justify-between px-1 pt-1 text-[10px] text-slate-400 border-t border-slate-800/60">
                  <span className="flex items-center gap-1 text-amber-400 font-bold">
                    <Activity className="w-3 h-3 text-amber-400 animate-pulse" />
                    <span>Smart Priority Triage Active</span>
                  </span>
                  <span className="font-mono text-slate-500 text-[9px]">
                    Auto-sorted by Hazard Proximity &bull; Casualty Density
                  </span>
                </div>
              </div>

              {/* Queue Cards List */}
              <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
                {filteredRequests.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-xs">
                    No distress signals matching current filters.
                  </div>
                ) : (
                  filteredRequests.map((req) => {
                    const isAcquired = req.status === 'acquired';
                    const isDispatched = req.status === 'dispatched';
                    const isResolved = req.status === 'resolved';
                    const isSelected = selectedNgoRequestId === req.id;
                    const isCurrentDispatched = activeDispatchedIncident?.id === req.id;

                    return (
                      <div
                        key={req.id}
                        onClick={() => handleFocusRequestOnMap(req)}
                        className={`p-3.5 rounded-xl border text-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'ring-2 ring-amber-400 bg-amber-950/40 border-amber-400 shadow-xl shadow-amber-950/60'
                            : isResolved
                            ? 'bg-slate-950/40 border-slate-800 opacity-60'
                            : isDispatched
                            ? 'bg-cyan-950/30 border-cyan-600/70 shadow-md shadow-cyan-950/30'
                            : isAcquired
                            ? 'bg-amber-950/30 border-amber-500 shadow-md shadow-amber-950/40'
                            : req.priority === 'critical'
                            ? 'bg-red-950/40 border-red-700/80 shadow'
                            : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                                req.priority === 'critical'
                                  ? 'bg-red-950 text-red-300 border border-red-600'
                                  : 'bg-amber-950 text-amber-300 border border-amber-600'
                              }`}
                            >
                              {req.priority}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">{req.id}</span>
                            {isSelected && (
                              <span className="text-[9px] font-bold text-amber-400 px-1.5 py-0.5 rounded bg-amber-950 border border-amber-700">
                                MAP FOCUSED
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                            <Clock className="w-3 h-3" />
                            <span>{req.timestamp}</span>
                          </div>
                        </div>

                        {/* SMART PRIORITY TRIAGE BADGE */}
                        {!isResolved && (
                          <div className="my-2 p-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2 shadow-inner">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`px-2 py-0.5 rounded-lg text-[9px] font-mono font-black uppercase tracking-wider flex items-center gap-1.5 border shadow-sm ${
                                  req.isInsideHazard
                                    ? 'bg-red-950 text-red-200 border-red-500 animate-pulse'
                                    : req.triageRank === 1
                                    ? 'bg-red-950 text-red-200 border-red-600'
                                    : req.triageRank === 2
                                    ? 'bg-amber-950 text-amber-200 border-amber-600'
                                    : 'bg-blue-950 text-blue-200 border-blue-600'
                                }`}
                              >
                                {req.isInsideHazard && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping"></span>
                                )}
                                <span>{req.triageBadgeLabel}</span>
                              </span>
                            </div>
                            <div className="flex items-center gap-1 font-mono text-[10px] shrink-0 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                              <span className="text-slate-400 text-[9px]">SCORE:</span>
                              <span className="text-amber-400 font-black">{req.triageScore}</span>
                            </div>
                          </div>
                        )}

                        <div className="font-bold text-white text-sm flex items-center justify-between">
                          <span>{req.citizenName}</span>
                          <span className="text-cyan-400 text-xs font-mono font-medium">
                            {req.peopleCount} Affected
                          </span>
                        </div>

                        <div className="text-[11px] text-cyan-300 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                          <span>{req.locationName}</span>
                        </div>

                        <p className="text-slate-300 text-[11px] bg-slate-950 p-2 rounded-lg border border-slate-800 mt-2">
                          "{req.description}"
                        </p>

                        {/* TEAM DISPATCHED ACTIVE STATUS BADGE */}
                        {isDispatched && (
                          <div className="mt-2.5 px-2.5 py-1.5 rounded-lg bg-cyan-950/90 text-cyan-300 border border-cyan-600/80 text-[10px] font-black flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                              <Truck className="w-3.5 h-3.5 text-cyan-400" />
                              <span>TEAM EN ROUTE &bull; RESPONDING</span>
                            </div>
                            <span className="text-[9px] font-mono text-cyan-300 font-bold">{req.acquiredBy || 'Alpha Unit'}</span>
                          </div>
                        )}

                        {isAcquired && !isDispatched && (
                          <div className="mt-2.5 px-2.5 py-1 rounded bg-amber-950/80 text-amber-300 border border-amber-600/60 text-[10px] font-extrabold flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                            <span>ACQUIRED BY YOUR TEAM &bull; RESPONDING IN PROGRESS</span>
                          </div>
                        )}

                        <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                          <span className="font-mono text-cyan-400 text-[10px]">
                            {req.contactNumber}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {!isResolved && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeployResponseTeam(req);
                                }}
                                className={`px-3 py-1.5 rounded-lg font-black text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer ${
                                  isCurrentDispatched
                                    ? 'bg-amber-400 text-slate-950 ring-2 ring-white animate-pulse'
                                    : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/20'
                                }`}
                                title="Deploy response team with OSRM street route"
                              >
                                <Truck className="w-3.5 h-3.5" />
                                <span>{isCurrentDispatched ? 'Team En Route' : 'Deploy Team / Respond'}</span>
                              </button>
                            )}

                            {!isResolved && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleResolveIncident(req.id);
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm cursor-pointer"
                                title="Mark incident safe and resolved"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Resolve</span>
                              </button>
                            )}

                            {isResolved && (
                              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Safe &bull; Resolved
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* VIEW 4: SHELTER INCHARGE DASHBOARD VIEW (#view-shelter)      */}
        {/* ============================================================ */}
        <div
          id="view-shelter"
          className={
            activeView === 'shelter' ? 'flex-1 flex flex-col w-full animate-in fade-in duration-200 p-4 lg:p-6 max-w-7xl mx-auto' : 'hidden'
          }
        >
          {/* Header with Shelter Selector / Authorized Facility Lock */}
          <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 flex flex-wrap items-center justify-between gap-4 mb-6 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-bold font-['Plus_Jakarta_Sans',sans-serif] text-white">
                    Shelter Incharge Operations Hub
                  </h2>
                  {authenticatedUser?.isRestricted && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold">
                      AUTHORIZED: {authenticatedUser.username}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  {authenticatedUser?.isRestricted
                    ? `Access isolated to ${managedShelter.name}. Capacity sync active across valley maps.`
                    : 'Real-time bed & resource synchronization across 10 Dehradun facilities'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-400 px-1">Managed Facility:</span>
              {authenticatedUser?.isRestricted ? (
                <div className="flex items-center gap-1.5 text-cyan-300 font-bold px-2 py-1 bg-slate-900 rounded-lg border border-slate-700">
                  <Lock className="w-3 h-3 text-cyan-400" />
                  <span>{managedShelter.name}</span>
                </div>
              ) : (
                <select
                  value={managedShelterId}
                  onChange={(e) => setManagedShelterId(e.target.value)}
                  className="bg-transparent text-cyan-300 font-bold outline-none cursor-pointer max-w-xs truncate"
                >
                  {shelters.map((s) => (
                    <option key={s.id} value={s.id} className="bg-slate-900 text-slate-200">
                      {s.name} ({s.currentOccupancy}/{s.totalCapacity})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Two-Column Grid: Left Controls | Right Map & Evacuee Log */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column (5 cols): Dynamic Shelter Occupancy & Resource Controls */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800 shadow-xl">
                <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2.5">
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-['Plus_Jakarta_Sans',sans-serif]">
                    Live Capacity Management
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isInsideHazardZone(managedShelter.coordinates)
                        ? 'bg-red-950 text-red-300 border border-red-700 animate-pulse'
                        : managedShelter.status === 'full'
                        ? 'bg-red-950 text-red-300'
                        : managedShelter.status === 'high_occupancy'
                        ? 'bg-amber-950 text-amber-300'
                        : 'bg-emerald-950 text-emerald-300'
                    }`}
                  >
                    {isInsideHazardZone(managedShelter.coordinates)
                      ? 'UNSAFE - INSIDE HAZARD ZONE'
                      : managedShelter.status.toUpperCase()}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white">{managedShelter.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{managedShelter.locationArea}</p>

                <div className="mt-4 bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                  <div className="text-3xl font-extrabold font-mono text-emerald-400">
                    {managedShelter.currentOccupancy}
                    <span className="text-sm font-sans text-slate-400"> / {managedShelter.totalCapacity} Beds</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {managedShelter.totalCapacity - managedShelter.currentOccupancy} Beds Available ({managedOccupancyPercent}% Full)
                  </div>
                  <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden mt-3">
                    <div
                      className={`h-full transition-all duration-300 ${
                        managedShelter.currentOccupancy >= managedShelter.totalCapacity
                          ? 'bg-red-500'
                          : managedOccupancyPercent >= 75
                          ? 'bg-amber-400'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${managedOccupancyPercent}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Quick Action Occupancy Adjusters:
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      onClick={() => handleAdjustOccupancy(managedShelterId, 5)}
                      className="py-2 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> 5
                    </button>
                    <button
                      onClick={() => handleAdjustOccupancy(managedShelterId, 10)}
                      className="py-2 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> 10
                    </button>
                    <button
                      onClick={() => handleAdjustOccupancy(managedShelterId, -5)}
                      className="py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" /> 5
                    </button>
                    <button
                      onClick={() => handleAdjustOccupancy(managedShelterId, -10)}
                      className="py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" /> 10
                    </button>
                  </div>
                  <button
                    onClick={() => setIsCustomCapacityModalOpen(true)}
                    className="w-full mt-2 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-cyan-300 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                    <span>Set Custom Capacity Value</span>
                  </button>
                </div>
              </div>

              {/* Resource Stock Management */}
              <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800 shadow-xl">
                <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2.5">
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-['Plus_Jakarta_Sans',sans-serif]">
                    Resource Inventory Controls
                  </span>
                  <span className="text-[10px] text-slate-400">Alert threshold: &lt;20%</span>
                </div>
                <div className="space-y-3 text-xs">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                        <span>Ready Meals (Packs)</span>
                        {isFoodLow && (
                          <span className="px-1.5 py-0.2 rounded bg-red-950 text-red-300 border border-red-700 text-[9px] font-bold uppercase animate-pulse">
                            Low Stock
                          </span>
                        )}
                      </span>
                      <span className="font-mono font-bold text-emerald-400 text-sm">
                        {managedShelter.resources.foodPacks}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleAdjustResource(managedShelterId, 'foodPacks', -50)}
                        className="px-2 py-1 rounded bg-slate-800 text-[10px] font-bold text-slate-300"
                      >
                        -50
                      </button>
                      <button
                        onClick={() => handleAdjustResource(managedShelterId, 'foodPacks', 100)}
                        className="px-2 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 text-[10px] font-bold"
                      >
                        +100 Restock
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                        <span>Clean Potable Water (Liters)</span>
                        {isWaterLow && (
                          <span className="px-1.5 py-0.2 rounded bg-red-950 text-red-300 border border-red-700 text-[9px] font-bold uppercase animate-pulse">
                            Low Stock
                          </span>
                        )}
                      </span>
                      <span className="font-mono font-bold text-cyan-400 text-sm">
                        {managedShelter.resources.waterLiters} L
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleAdjustResource(managedShelterId, 'waterLiters', -200)}
                        className="px-2 py-1 rounded bg-slate-800 text-[10px] font-bold text-slate-300"
                      >
                        -200L
                      </button>
                      <button
                        onClick={() => handleAdjustResource(managedShelterId, 'waterLiters', 500)}
                        className="px-2 py-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-700 text-[10px] font-bold"
                      >
                        +500L Tanker
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                        <span>Trauma &amp; First Aid Kits</span>
                        {isMedicalLow && (
                          <span className="px-1.5 py-0.2 rounded bg-red-950 text-red-300 border border-red-700 text-[9px] font-bold uppercase animate-pulse">
                            Low Stock
                          </span>
                        )}
                      </span>
                      <span className="font-mono font-bold text-amber-400 text-sm">
                        {managedShelter.resources.medicalKits}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleAdjustResource(managedShelterId, 'medicalKits', -10)}
                        className="px-2 py-1 rounded bg-slate-800 text-[10px] font-bold text-slate-300"
                      >
                        -10
                      </button>
                      <button
                        onClick={() => handleAdjustResource(managedShelterId, 'medicalKits', 25)}
                        className="px-2 py-1 rounded bg-amber-950 text-amber-300 border border-amber-700 text-[10px] font-bold"
                      >
                        +25 Kits
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                        <span>Thermal Blankets</span>
                        {isBlanketsLow && (
                          <span className="px-1.5 py-0.2 rounded bg-red-950 text-red-300 border border-red-700 text-[9px] font-bold uppercase animate-pulse">
                            Low Stock
                          </span>
                        )}
                      </span>
                      <span className="font-mono font-bold text-slate-200 text-sm">
                        {managedShelter.resources.blankets}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleAdjustResource(managedShelterId, 'blankets', -20)}
                        className="px-2 py-1 rounded bg-slate-800 text-[10px] font-bold text-slate-300"
                      >
                        -20
                      </button>
                      <button
                        onClick={() => handleAdjustResource(managedShelterId, 'blankets', 50)}
                        className="px-2 py-1 rounded bg-slate-800 text-white border border-slate-600 text-[10px] font-bold"
                      >
                        +50 Blankets
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column (7 cols): Interactive Shelter Map & Evacuee Log */}
            <div className="lg:col-span-7 space-y-6 flex flex-col">
              <div
                className={`bg-slate-900/80 rounded-2xl p-4 border border-slate-800 shadow-xl flex flex-col transition-all duration-300 ${
                  isShelterMapFullscreen
                    ? 'fixed inset-0 z-50 w-screen h-screen bg-[#030712] flex flex-col p-4'
                    : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white font-['Plus_Jakarta_Sans',sans-serif]">
                    Facility Geographic Surroundings &amp; Hazard Radar
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-cyan-400 font-mono">
                      {managedShelter.coordinates[0]} N, {managedShelter.coordinates[1]} E
                    </span>
                    <button
                      onClick={() => toggleMapFullscreen('shelter')}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer"
                      title={isShelterMapFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                    >
                      {isShelterMapFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className={`w-full rounded-xl overflow-hidden border border-slate-800 relative ${isShelterMapFullscreen ? 'flex-1' : 'h-64'}`}>
                  <div id="shelter-map" ref={shelterMapContainerRef} className="w-full h-full z-10" />
                </div>
              </div>

              {/* Evacuee Log Table */}
              <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800 shadow-xl flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2.5">
                  <div>
                    <h3 className="text-sm font-bold text-white font-['Plus_Jakarta_Sans',sans-serif] flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
                      <span>Incoming Evacuee Roster &amp; Special Triage</span>
                    </h3>
                    <p className="text-[11px] text-slate-400">Registered admissions for {managedShelter.name}</p>
                  </div>
                  <button
                    onClick={() => setIsCheckInModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-600/30 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Check-In Evacuee</span>
                  </button>
                </div>
                <div className="flex-1 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-[10px] uppercase text-slate-400 font-semibold tracking-wider">
                        <th className="py-2 px-2">ID</th>
                        <th className="py-2 px-2">Family Head</th>
                        <th className="py-2 px-2">Count</th>
                        <th className="py-2 px-2">Origin Area</th>
                        <th className="py-2 px-2">Medical Needs</th>
                        <th className="py-2 px-2">Block</th>
                        <th className="py-2 px-2 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {evacueeLogs
                        .filter((e) => e.shelterId === managedShelterId)
                        .map((log) => (
                          <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-2.5 px-2 font-mono text-cyan-400 text-[11px] font-bold">
                              {log.id}
                            </td>
                            <td className="py-2.5 px-2 font-bold text-white">{log.headOfFamily}</td>
                            <td className="py-2.5 px-2 font-mono text-slate-300">{log.peopleCount}</td>
                            <td className="py-2.5 px-2 text-slate-300 text-[11px]">{log.originArea}</td>
                            <td className="py-2.5 px-2 text-slate-400 text-[11px] max-w-xs truncate">
                              {log.medicalNeeds}
                            </td>
                            <td className="py-2.5 px-2 font-mono text-amber-300 text-[11px]">
                              {log.allocatedBlock}
                            </td>
                            <td className="py-2.5 px-2 text-right">
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">
                                {log.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* VIEW 5: EMERGENCY CONTACTS VIEW (#view-contacts)             */}
        {/* ============================================================ */}
        <div
          id="view-contacts"
          className={
            activeView === 'contacts'
              ? 'flex-1 max-w-7xl mx-auto w-full px-4 lg:px-8 py-8 flex flex-col gap-6 animate-in fade-in duration-200'
              : 'hidden'
          }
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-2xl font-bold font-['Plus_Jakarta_Sans',sans-serif] text-white flex items-center gap-2">
                <PhoneCall className="w-6 h-6 text-amber-400" />
                <span>Dehradun Official Emergency Helplines &amp; Control Rooms</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Verified 24/7 tactical rescue, disaster management, and medical trauma centers for Dehradun and Uttarakhand.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-3 py-1.5 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-600/40 font-mono font-bold">
                VHF RADIO: CH-04 / CH-07
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {EMERGENCY_CONTACTS.map((contact) => (
              <div
                key={contact.id}
                className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-6 border border-slate-800 hover:border-slate-700 transition-all shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-slate-800 text-cyan-300 border border-slate-700">
                      {contact.badge}
                    </span>
                    <span className="text-xs text-slate-400">{contact.category}</span>
                  </div>
                  <h3 className="text-base font-bold text-white font-['Plus_Jakarta_Sans',sans-serif] leading-snug">
                    {contact.agency}
                  </h3>
                  <p className="text-xs text-slate-300 mt-2.5 leading-relaxed">
                    {contact.description}
                  </p>
                  <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{contact.location}</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-mono">Emergency Direct</div>
                    <div className="text-lg font-extrabold text-emerald-400 font-mono tracking-wider">
                      {contact.phone}
                    </div>
                  </div>
                  <a
                    href={`tel:${contact.phone.replace(/[^0-9+]/g, '')}`}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-700/20 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Call Now</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* ============================================================== */}
      {/* MODAL: CUSTOM CAPACITY (SHELTER INCHARGE)                     */}
      {/* ============================================================== */}
      {isCustomCapacityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm bg-[#0a1122] rounded-3xl border border-slate-700 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">Set Custom Occupancy</h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter the exact bed count currently in use at <b>{managedShelter.name}</b> (Max: {managedShelter.totalCapacity}).
            </p>
            <form onSubmit={handleSetCustomOccupancy}>
              <input
                type="number"
                min="0"
                max={managedShelter.totalCapacity}
                value={customCapacityValue}
                onChange={(e) => setCustomCapacityValue(e.target.value)}
                placeholder="e.g. 450"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-mono outline-none focus:border-cyan-500"
                autoFocus
              />
              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCustomCapacityModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs shadow cursor-pointer"
                >
                  Update Capacity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: QUICK EVACUEE CHECK-IN (SHELTER INCHARGE)              */}
      {/* ============================================================== */}
      {isCheckInModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#0a1122] rounded-3xl border border-slate-700 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">Admit Evacuee Family</h3>
              <button
                onClick={() => setIsCheckInModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCheckInEvacueeSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Head of Family Name</label>
                <input
                  type="text"
                  required
                  value={checkInName}
                  onChange={(e) => setCheckInName(e.target.value)}
                  placeholder="e.g. Ramesh Chandra Joshi"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-cyan-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Total Family Members</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    required
                    value={checkInPeopleCount}
                    onChange={(e) => setCheckInPeopleCount(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Origin Flooded Sector</label>
                  <input
                    type="text"
                    required
                    value={checkInOrigin}
                    onChange={(e) => setCheckInOrigin(e.target.value)}
                    placeholder="e.g. Chander Nagar Basin"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Medical / Diet Needs</label>
                <input
                  type="text"
                  value={checkInNeeds}
                  onChange={(e) => setCheckInNeeds(e.target.value)}
                  placeholder="e.g. Diabetics meds, infant formula"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none"
                />
              </div>
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCheckInModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold shadow cursor-pointer"
                >
                  Confirm Check-In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: EMERGENCY ASSISTANCE REPORTING                          */}
      {/* ============================================================== */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-[#0a1122] rounded-3xl border border-slate-700/80 p-6 md:p-8 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-950/80 border border-red-700/60 flex items-center justify-center text-red-400 shadow">
                  <AlertOctagon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-['Plus_Jakarta_Sans',sans-serif] text-lg font-bold text-white">
                    Report Detailed Emergency
                  </h3>
                  <p className="text-[11px] text-slate-400">GarudaResQ Dehradun Citizen Rescue Dispatch</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReportAssistanceSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Contact Phone Number <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={reportPhone}
                    onChange={(e) => setReportPhone(e.target.value)}
                    placeholder="+91 98970 XXXXX"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Exact Landmark / Street <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={reportLandmark}
                    onChange={(e) => setReportLandmark(e.target.value)}
                    placeholder="e.g. Near Tapovan Bridge, Rajpur Rd"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Emergency Category</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['Flood', 'Landslide', 'Structural Damage', 'Medical'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setReportCategory(cat)}
                      className={`py-2 px-2.5 rounded-xl font-bold text-center border transition-all ${
                        reportCategory === cat
                          ? 'bg-red-600 text-white border-red-400 shadow-md shadow-red-700/30'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Affected People</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setReportPeopleCount((p) => Math.max(1, p - 1))}
                      className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer"
                    >
                      -
                    </button>
                    <span className="w-12 text-center font-mono font-bold text-base text-white">
                      {reportPeopleCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => setReportPeopleCount((p) => p + 1)}
                      className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Severity Rating</label>
                  <select
                    value={reportSeverity}
                    onChange={(e) => setReportSeverity(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-semibold outline-none"
                  >
                    <option value="critical">CRITICAL (Immediate Life Threat)</option>
                    <option value="high">HIGH (Rising Water / Trapped)</option>
                    <option value="moderate">MODERATE (Supplies Exhausted)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Situation Description</label>
                <textarea
                  required
                  rows={3}
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Detail water level, trapped family members, or urgent medical needs..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEmergencySubmitting}
                  className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white font-bold tracking-wide shadow-lg shadow-red-700/30 flex items-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{isEmergencySubmitting ? 'Submitting...' : 'Submit Distress Signal'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: DUAL SOS ENGINE (HOTLINE CALL + 1-TAP RESCUE BROADCAST) */}
      {/* ============================================================== */}
      {isDualSosModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-[#0c0505] rounded-3xl border-2 border-red-600/80 p-6 md:p-8 shadow-2xl overflow-hidden">
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex items-center justify-between pb-4 border-b border-red-900/60 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-red-600/20 border border-red-500 flex items-center justify-center text-red-400 shadow-lg shadow-red-950/60">
                  <Siren className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-['Plus_Jakarta_Sans',sans-serif] text-xl font-black text-white tracking-tight flex items-center gap-2">
                    <span>DUAL SOS ENGINE</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-950 text-red-300 border border-red-700 uppercase">
                      CRITICAL
                    </span>
                  </h3>
                  <p className="text-xs text-red-300/80">Immediate Rescue Assistance for Dehradun Region</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDualSosModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 mb-5 leading-relaxed">
              If you or someone nearby is in acute danger, stranded in rising waters, or trapped by landslides, choose an emergency response action below:
            </p>

            <div className="space-y-4">
              {/* OPTION 1: QUICK 1-TAP SOS BROADCAST */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-red-950/70 via-red-900/40 to-slate-900/70 border-2 border-red-500/80 shadow-xl relative overflow-hidden group">
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div>
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-red-600 text-white mb-1">
                      OPTION 1 &bull; RAPID ONE-TAP BEACON
                    </span>
                    <h4 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                      <span>Quick One-Tap SOS Broadcast</span>
                    </h4>
                  </div>
                  <Radio className="w-5 h-5 text-red-400 shrink-0 animate-pulse" />
                </div>
                <p className="text-xs text-slate-300 mb-3.5 leading-relaxed">
                  Broadcasts your fixed location coordinates (<span className="text-cyan-400 font-mono font-bold">{citizenLocation[0].toFixed(5)} N, {citizenLocation[1].toFixed(5)} E</span>) directly into the active NGO Tactical Queue and SDRF dispatch feed in 1 tap without filling out any forms.
                </p>
                <button
                  type="button"
                  onClick={handleInstantSOS}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-red-700/50 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
                >
                  <Siren className="w-4 h-4 text-white" />
                  <span>ACTIVATE 1-TAP RESCUE BEACON NOW</span>
                </button>
              </div>

              {/* OPTION 2: CALL EMERGENCY HOTLINE */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 mb-1">
                      OPTION 2 &bull; 24/7 HELPLINE CALL
                    </span>
                    <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                      <span>Call Emergency Response Hotline</span>
                    </h4>
                  </div>
                  <PhoneCall className="w-5 h-5 text-amber-400 shrink-0" />
                </div>
                <p className="text-xs text-slate-400 mb-3.5 leading-relaxed">
                  Direct connection to Uttarakhand State Disaster Response Force (SDRF) or District Emergency Operations Centre (DEOC).
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <a
                    href="tel:1070"
                    className="py-3 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-red-500/50 text-red-300 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-red-400" />
                    <span>Dial SDRF (1070)</span>
                  </a>
                  <a
                    href="tel:112"
                    className="py-3 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-cyan-500/50 text-cyan-300 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Dial Police &amp; EMS (112)</span>
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-900 flex items-center justify-between text-xs text-slate-400">
              <button
                type="button"
                onClick={() => {
                  setIsDualSosModalOpen(false);
                  setIsReportModalOpen(true);
                }}
                className="text-slate-400 hover:text-white underline font-medium cursor-pointer"
              >
                Prefer to fill detailed damage report?
              </button>
              <button
                type="button"
                onClick={() => setIsDualSosModalOpen(false)}
                className="text-slate-500 hover:text-slate-300 font-medium cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: INSTANT SOS CONFIRMATION OVERLAY                         */}
      {/* ============================================================== */}
      {sosAlertOverlay && sosAlertOverlay.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-red-950/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="relative w-full max-w-lg bg-[#0c0505] rounded-3xl border-2 border-red-500 p-6 md:p-8 shadow-2xl text-center overflow-hidden">
            <div className="w-20 h-20 mx-auto rounded-full bg-red-600/20 border-2 border-red-500 flex items-center justify-center text-red-500 shadow-xl mb-4">
              <Siren className="w-10 h-10 animate-pulse text-red-400" />
            </div>
            <div className="inline-block px-3 py-1 rounded-full bg-red-950 text-red-300 border border-red-700 text-xs font-mono font-bold tracking-widest mb-2">
              DISTRESS ID: {sosAlertOverlay.trackingId}
            </div>
            <h3 className="font-['Plus_Jakarta_Sans',sans-serif] text-2xl font-black text-white tracking-tight">
              SOS ALERT TRANSMITTED TO RELIEF TEAMS
            </h3>
            <p className="text-sm font-bold text-red-400 mt-2 uppercase tracking-wide">
              STAY CALM &bull; YOUR EMERGENCY BEACON IS ACTIVE
            </p>
            <div className="mt-4 p-4 rounded-2xl bg-red-950/40 border border-red-900/60 text-xs text-slate-300 space-y-2 text-left">
              <div className="flex justify-between border-b border-red-900/40 pb-1.5">
                <span className="text-slate-400">Transmitted Coordinates:</span>
                <span className="font-mono text-cyan-400 font-bold">
                  {sosAlertOverlay.coords[0].toFixed(5)} N, {sosAlertOverlay.coords[1].toFixed(5)} E
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Dispatched Agency:</span>
                <span className="text-white font-medium">Uttarakhand SDRF &amp; DDMA Quick Dispatch</span>
              </div>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="tel:1070"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs tracking-wider shadow-lg shadow-red-700/50 flex items-center justify-center gap-2 cursor-pointer"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Call SDRF Uttarakhand (1070)</span>
              </a>
              <button
                type="button"
                onClick={() => setSosAlertOverlay(null)}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs cursor-pointer"
              >
                Dismiss Overlay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* REQUIREMENT 4: MULTI-SHELTER & NGO AUTHENTICATION MODAL       */}
      {/* ============================================================== */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-[#0a1122] rounded-3xl border border-slate-700/80 p-6 md:p-8 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-emerald-400 shadow">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-['Plus_Jakarta_Sans',sans-serif] text-lg font-bold text-white">
                    Mission Control Authentication
                  </h3>
                  <p className="text-[11px] text-slate-400">GarudaResQ Dehradun Tactical Access &bull; Multi-Shelter Switcher</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 mb-5">
              <button
                type="button"
                onClick={() => {
                  setTargetAuthRole('shelter');
                  setAuthUsername('shelter_clocktower');
                  setAuthPassword('safe123');
                  setAuthError('');
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  targetAuthRole === 'shelter'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Shelter Incharge</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setTargetAuthRole('ngo');
                  setAuthUsername('ngo_admin');
                  setAuthPassword('resq123');
                  setAuthError('');
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  targetAuthRole === 'ngo'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <HeartHandshake className="w-4 h-4" />
                <span>NGO Operations</span>
              </button>
            </div>

            {/* MULTI-SHELTER CREDENTIALS HINT CARDS */}
            <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 mb-5 text-xs">
              <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center justify-between mb-2">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Authorized Dehradun Facility Logins</span>
                </span>
                <span className="text-[10px] text-slate-400">Tap to Quick-Fill</span>
              </div>

              {targetAuthRole === 'shelter' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthUsername('shelter_clocktower');
                      setAuthPassword('safe123');
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      authUsername === 'shelter_clocktower'
                        ? 'bg-cyan-950/80 border-cyan-500 text-white'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="font-bold text-white text-[11px] flex items-center justify-between">
                      <span>Clock Tower Center</span>
                      <span className="text-[9px] font-mono text-cyan-400 font-normal">#1</span>
                    </div>
                    <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                      ID: <span className="text-cyan-300">shelter_clocktower</span>
                    </div>
                    <div className="font-mono text-[10px] text-slate-500">Pass: safe123</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAuthUsername('shelter_parade');
                      setAuthPassword('safe123');
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      authUsername === 'shelter_parade'
                        ? 'bg-cyan-950/80 border-cyan-500 text-white'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="font-bold text-white text-[11px] flex items-center justify-between">
                      <span>Parade Ground Hub</span>
                      <span className="text-[9px] font-mono text-cyan-400 font-normal">#2</span>
                    </div>
                    <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                      ID: <span className="text-cyan-300">shelter_parade</span>
                    </div>
                    <div className="font-mono text-[10px] text-slate-500">Pass: safe123</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAuthUsername('shelter_isbt');
                      setAuthPassword('safe123');
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      authUsername === 'shelter_isbt'
                        ? 'bg-cyan-950/80 border-cyan-500 text-white'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="font-bold text-white text-[11px] flex items-center justify-between">
                      <span>ISBT Transport Hub</span>
                      <span className="text-[9px] font-mono text-cyan-400 font-normal">#3</span>
                    </div>
                    <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                      ID: <span className="text-cyan-300">shelter_isbt</span>
                    </div>
                    <div className="font-mono text-[10px] text-slate-500">Pass: safe123</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAuthUsername('shelter_clement');
                      setAuthPassword('safe123');
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      authUsername === 'shelter_clement'
                        ? 'bg-cyan-950/80 border-cyan-500 text-white'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="font-bold text-white text-[11px] flex items-center justify-between">
                      <span>Graphic Era Clement</span>
                      <span className="text-[9px] font-mono text-cyan-400 font-normal">#4</span>
                    </div>
                    <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                      ID: <span className="text-cyan-300">shelter_clement</span>
                    </div>
                    <div className="font-mono text-[10px] text-slate-500">Pass: safe123</div>
                  </button>
                </div>
              ) : (
                <div className="font-mono text-slate-300 space-y-1 mt-1 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div>Role: <span className="text-amber-400 font-bold">NGO Relief Commander</span></div>
                  <div>ID: <span className="text-white font-bold">ngo_admin</span></div>
                  <div>Password: <span className="text-white font-bold">resq123</span></div>
                </div>
              )}
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {authError && (
                <div className="p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-200 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{authError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {targetAuthRole === 'ngo' ? 'NGO Commander ID' : 'Facility Incharge ID'}
                </label>
                <input
                  type="text"
                  value={authUsername}
                  onChange={(e) => setAuthUsername(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white text-xs font-mono outline-none"
                  placeholder="Enter authorized User ID"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Passcode / Token</label>
                <input
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white text-xs font-mono outline-none"
                  placeholder="Enter Passcode"
                />
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (targetAuthRole === 'ngo') {
                      setAuthUsername('ngo_admin');
                      setAuthPassword('resq123');
                    } else {
                      setAuthUsername('shelter_clocktower');
                      setAuthPassword('safe123');
                    }
                  }}
                  className="text-xs text-slate-400 hover:text-slate-200 underline font-medium cursor-pointer"
                >
                  Auto-Fill Default
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs tracking-wide shadow-lg shadow-cyan-700/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Authorize &amp; Launch</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* FOOTER                                                         */}
      {/* ============================================================== */}
      <footer className="bg-[#030712] border-t border-slate-800/80 py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">GarudaResQ &bull; Dehradun Region</span>
            <span>|</span>
            <span>OSRM Street Routing Engine &bull; 10 District Shelters</span>
          </div>
          <div>
            Location Risk Assessment &bull; Smooth Camera Tracking &bull; Multi-Shelter Hub
          </div>
        </div>
      </footer>
    </div>
  );
}
