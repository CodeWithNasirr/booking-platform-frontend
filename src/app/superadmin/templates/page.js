// import React, { useState } from 'react';
// import SuperAdminLayout from '../../components/super-admin/SuperAdminLayout';
// import {
//   Plus,
//   Search,
//   Filter,
//   Grid,
//   List,
//   Edit,
//   Copy,
//   Trash2,
//   Eye,
//   MoreVertical,
//   Star,
// } from 'lucide-react';
// import { Button } from '../../components/ui/button';
// import { Card } from '../../components/ui/card';
// import { Badge } from '../../components/ui/badge';
// import { Input } from '../../components/ui/input';
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '../../components/ui/select';
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from '../../components/ui/dropdown-menu';
// import { Switch } from '../../components/ui/switch';

// interface TemplatesLibraryProps {
//   onNavigate: (page: string, data?: any) => void;
// }

// export default function TemplatesLibrary({ onNavigate }: TemplatesLibraryProps) {
//   const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
//   const [searchQuery, setSearchQuery] = useState('');

//   const stats = [
//     { label: 'Total Templates', value: '24' },
//     { label: 'Active', value: '21' },
//     { label: 'Draft', value: '3' },
//     { label: 'Total Uses', value: '1,245' },
//   ];

//   const templates = [
//     {
//       id: 'tmp-1',
//       name: 'Modern Spa',
//       category: 'Beauty & Wellness',
//       preview: '🧖‍♀️',
//       color: 'from-pink-500 to-rose-500',
//       status: 'active',
//       uses: 145,
//       featured: true,
//       description: 'Elegant spa and wellness center template',
//       lastUpdated: '2 days ago',
//     },
//     {
//       id: 'tmp-2',
//       name: 'Professional Salon',
//       category: 'Beauty & Wellness',
//       preview: '💇‍♀️',
//       color: 'from-purple-500 to-indigo-500',
//       status: 'active',
//       uses: 198,
//       featured: true,
//       description: 'Professional hair salon and beauty services',
//       lastUpdated: '5 days ago',
//     },
//     {
//       id: 'tmp-3',
//       name: 'Home Services',
//       category: 'Home & Maintenance',
//       preview: '🏠',
//       color: 'from-blue-500 to-cyan-500',
//       status: 'active',
//       uses: 156,
//       featured: false,
//       description: 'Home repair and maintenance services',
//       lastUpdated: '1 week ago',
//     },
//     {
//       id: 'tmp-4',
//       name: 'Medical Clinic',
//       category: 'Healthcare',
//       preview: '🏥',
//       color: 'from-green-500 to-emerald-500',
//       status: 'active',
//       uses: 89,
//       featured: false,
//       description: 'Medical clinic and healthcare appointments',
//       lastUpdated: '3 days ago',
//     },
//     {
//       id: 'tmp-5',
//       name: 'Fitness Studio',
//       category: 'Fitness & Sports',
//       preview: '💪',
//       color: 'from-orange-500 to-amber-500',
//       status: 'active',
//       uses: 212,
//       featured: true,
//       description: 'Gym and fitness class bookings',
//       lastUpdated: '1 day ago',
//     },
//     {
//       id: 'tmp-6',
//       name: 'Auto Services',
//       category: 'Automotive',
//       preview: '🚗',
//       color: 'from-gray-600 to-gray-700',
//       status: 'active',
//       uses: 78,
//       featured: false,
//       description: 'Auto repair and maintenance services',
//       lastUpdated: '4 days ago',
//     },
//     {
//       id: 'tmp-7',
//       name: 'Pet Grooming',
//       category: 'Pet Care',
//       preview: '🐕',
//       color: 'from-teal-500 to-cyan-500',
//       status: 'active',
//       uses: 134,
//       featured: false,
//       description: 'Pet grooming and care services',
//       lastUpdated: '6 days ago',
//     },
//     {
//       id: 'tmp-8',
//       name: 'Cleaning Services',
//       category: 'Home & Maintenance',
//       preview: '🧹',
//       color: 'from-blue-400 to-blue-500',
//       status: 'active',
//       uses: 167,
//       featured: false,
//       description: 'Professional cleaning services',
//       lastUpdated: '2 days ago',
//     },
//     {
//       id: 'tmp-9',
//       name: 'Education',
//       category: 'Education',
//       preview: '🎓',
//       color: 'from-indigo-500 to-purple-500',
//       status: 'draft',
//       uses: 0,
//       featured: false,
//       description: 'Tutoring and educational services',
//       lastUpdated: '1 week ago',
//     },
//   ];

//   const categories = [
//     'All Categories',
//     'Beauty & Wellness',
//     'Healthcare',
//     'Fitness & Sports',
//     'Home & Maintenance',
//     'Automotive',
//     'Pet Care',
//     'Education',
//   ];

//   const breadcrumbs = [{ label: 'Templates Library' }];

//   return (
//     <SuperAdminLayout
//       currentPage="super-admin-templates"
//       onNavigate={onNavigate}
//       title="Templates Library"
//       description="Manage website templates for tenants"
//       breadcrumbs={breadcrumbs}
//     >
//       {/* Stats Grid */}
//       <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
//         {stats.map((stat, index) => (
//           <Card key={index} className="p-4 border-gray-200 rounded-xl">
//             <div className="text-2xl text-gray-900 mb-1">{stat.value}</div>
//             <div className="text-sm text-gray-600">{stat.label}</div>
//           </Card>
//         ))}
//       </div>

//       {/* Filters and Actions */}
//       <Card className="p-6 mb-6 border-gray-200 rounded-xl">
//         <div className="flex flex-col lg:flex-row gap-4">
//           {/* Search */}
//           <div className="flex-1 relative">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
//             <Input
//               type="text"
//               placeholder="Search templates..."
//               className="pl-10 h-11 rounded-xl"
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//             />
//           </div>

//           {/* Category Filter */}
//           <Select defaultValue="all">
//             <SelectTrigger className="w-full lg:w-56 h-11 rounded-xl">
//               <SelectValue placeholder="Category" />
//             </SelectTrigger>
//             <SelectContent>
//               {categories.map((category) => (
//                 <SelectItem key={category} value={category.toLowerCase().replace(/\s+/g, '-')}>
//                   {category}
//                 </SelectItem>
//               ))}
//             </SelectContent>
//           </Select>

//           {/* Status Filter */}
//           <Select defaultValue="all">
//             <SelectTrigger className="w-full lg:w-48 h-11 rounded-xl">
//               <SelectValue placeholder="Status" />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="all">All Status</SelectItem>
//               <SelectItem value="active">Active</SelectItem>
//               <SelectItem value="draft">Draft</SelectItem>
//             </SelectContent>
//           </Select>

//           {/* View Mode Toggle */}
//           <div className="flex gap-2">
//             <Button
//               variant={viewMode === 'grid' ? 'default' : 'outline'}
//               size="sm"
//               className="rounded-lg"
//               onClick={() => setViewMode('grid')}
//             >
//               <Grid className="w-4 h-4" />
//             </Button>
//             <Button
//               variant={viewMode === 'list' ? 'default' : 'outline'}
//               size="sm"
//               className="rounded-lg"
//               onClick={() => setViewMode('list')}
//             >
//               <List className="w-4 h-4" />
//             </Button>
//           </div>

//           {/* Add Template */}
//           <Button
//             onClick={() => onNavigate('super-admin-template-form', { mode: 'create' })}
//             className="bg-[#3A7BFF] hover:bg-[#2D63D9] rounded-xl"
//           >
//             <Plus className="w-4 h-4 mr-2" />
//             Add Template
//           </Button>
//         </div>
//       </Card>

//       {/* Templates Grid/List */}
//       {viewMode === 'grid' ? (
//         <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
//           {templates.map((template) => (
//             <Card
//               key={template.id}
//               className="group border-gray-200 rounded-xl hover:shadow-lg transition-all overflow-hidden"
//             >
//               {/* Preview */}
//               <div
//                 className={`relative w-full aspect-video bg-gradient-to-br ${template.color} flex items-center justify-center`}
//               >
//                 <span className="text-6xl">{template.preview}</span>
//                 {template.featured && (
//                   <div className="absolute top-3 right-3">
//                     <Badge className="bg-yellow-100 text-yellow-700 border-0">
//                       <Star className="w-3 h-3 mr-1" />
//                       Featured
//                     </Badge>
//                   </div>
//                 )}
//                 <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
//                   <Button
//                     variant="secondary"
//                     size="sm"
//                     className="rounded-lg"
//                     onClick={() => onNavigate('super-admin-template-preview', { templateId: template.id })}
//                   >
//                     <Eye className="w-4 h-4 mr-2" />
//                     Preview
//                   </Button>
//                 </div>
//               </div>

//               {/* Content */}
//               <div className="p-6">
//                 <div className="flex items-start justify-between mb-3">
//                   <div className="flex-1">
//                     <h3 className="text-lg text-gray-900 mb-1">{template.name}</h3>
//                     <Badge variant="outline" className="text-xs rounded-lg">
//                       {template.category}
//                     </Badge>
//                   </div>
//                   <DropdownMenu>
//                     <DropdownMenuTrigger asChild>
//                       <Button variant="ghost" size="sm" className="rounded-lg">
//                         <MoreVertical className="w-4 h-4" />
//                       </Button>
//                     </DropdownMenuTrigger>
//                     <DropdownMenuContent align="end">
//                       <DropdownMenuItem
//                         onClick={() =>
//                           onNavigate('super-admin-template-form', { mode: 'edit', templateId: template.id })
//                         }
//                       >
//                         <Edit className="w-4 h-4 mr-2" />
//                         Edit
//                       </DropdownMenuItem>
//                       <DropdownMenuItem>
//                         <Copy className="w-4 h-4 mr-2" />
//                         Duplicate
//                       </DropdownMenuItem>
//                       <DropdownMenuItem className="text-red-600">
//                         <Trash2 className="w-4 h-4 mr-2" />
//                         Delete
//                       </DropdownMenuItem>
//                     </DropdownMenuContent>
//                   </DropdownMenu>
//                 </div>

//                 <p className="text-sm text-gray-600 mb-4">{template.description}</p>

//                 <div className="flex items-center justify-between pt-4 border-t border-gray-200">
//                   <div className="flex items-center gap-4 text-sm text-gray-600">
//                     <span>{template.uses} uses</span>
//                     <Badge
//                       className={`${
//                         template.status === 'active'
//                           ? 'bg-green-100 text-green-700'
//                           : 'bg-gray-100 text-gray-700'
//                       } border-0`}
//                     >
//                       {template.status}
//                     </Badge>
//                   </div>
//                   <span className="text-xs text-gray-500">{template.lastUpdated}</span>
//                 </div>
//               </div>
//             </Card>
//           ))}
//         </div>
//       ) : (
//         <Card className="border-gray-200 rounded-xl overflow-hidden">
//           <div className="overflow-x-auto">
//             <table className="w-full">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th className="px-6 py-3 text-start text-sm text-gray-600">Template</th>
//                   <th className="px-6 py-3 text-start text-sm text-gray-600">Category</th>
//                   <th className="px-6 py-3 text-start text-sm text-gray-600">Status</th>
//                   <th className="px-6 py-3 text-start text-sm text-gray-600">Uses</th>
//                   <th className="px-6 py-3 text-start text-sm text-gray-600">Last Updated</th>
//                   <th className="px-6 py-3 text-right text-sm text-gray-600">Actions</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-gray-200">
//                 {templates.map((template) => (
//                   <tr key={template.id} className="hover:bg-gray-50">
//                     <td className="px-6 py-4">
//                       <div className="flex items-center gap-3">
//                         <div
//                           className={`w-12 h-12 rounded-lg bg-gradient-to-br ${template.color} flex items-center justify-center text-2xl`}
//                         >
//                           {template.preview}
//                         </div>
//                         <div>
//                           <div className="text-sm text-gray-900 flex items-center gap-2">
//                             {template.name}
//                             {template.featured && (
//                               <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
//                             )}
//                           </div>
//                           <div className="text-xs text-gray-500">{template.description}</div>
//                         </div>
//                       </div>
//                     </td>
//                     <td className="px-6 py-4">
//                       <Badge variant="outline" className="rounded-lg">
//                         {template.category}
//                       </Badge>
//                     </td>
//                     <td className="px-6 py-4">
//                       <Badge
//                         className={`${
//                           template.status === 'active'
//                             ? 'bg-green-100 text-green-700'
//                             : 'bg-gray-100 text-gray-700'
//                         } border-0`}
//                       >
//                         {template.status}
//                       </Badge>
//                     </td>
//                     <td className="px-6 py-4 text-sm text-gray-700">{template.uses}</td>
//                     <td className="px-6 py-4 text-sm text-gray-600">{template.lastUpdated}</td>
//                     <td className="px-6 py-4 text-right">
//                       <DropdownMenu>
//                         <DropdownMenuTrigger asChild>
//                           <Button variant="ghost" size="sm" className="rounded-lg">
//                             <MoreVertical className="w-4 h-4" />
//                           </Button>
//                         </DropdownMenuTrigger>
//                         <DropdownMenuContent align="end">
//                           <DropdownMenuItem
//                             onClick={() =>
//                               onNavigate('super-admin-template-preview', { templateId: template.id })
//                             }
//                           >
//                             <Eye className="w-4 h-4 mr-2" />
//                             Preview
//                           </DropdownMenuItem>
//                           <DropdownMenuItem
//                             onClick={() =>
//                               onNavigate('super-admin-template-form', { mode: 'edit', templateId: template.id })
//                             }
//                           >
//                             <Edit className="w-4 h-4 mr-2" />
//                             Edit
//                           </DropdownMenuItem>
//                           <DropdownMenuItem>
//                             <Copy className="w-4 h-4 mr-2" />
//                             Duplicate
//                           </DropdownMenuItem>
//                           <DropdownMenuItem className="text-red-600">
//                             <Trash2 className="w-4 h-4 mr-2" />
//                             Delete
//                           </DropdownMenuItem>
//                         </DropdownMenuContent>
//                       </DropdownMenu>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </Card>
//       )}
//     </SuperAdminLayout>
//   );
// }
