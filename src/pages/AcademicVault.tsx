import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Download,
  Search,
  PlusCircle,
  Trash2,
  Edit,
  Eye,
  Library,
  X,
  FolderOpen,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import {
  AcademicResource,
  AcademicCycle,
  EngineeringStream,
  ResourceType,
  UserProfile,
} from '../types';
import { safeGetJson, safeSetJson } from '../utils/safeStorage';
import {
  db,
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
} from '../services/mockFirebase';

interface AcademicVaultProps {
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
}

const STREAMS: EngineeringStream[] = [
  'CSE',
  'CSE(AIML)',
  'CSE(DS)',
  'CSE(AIDS)',
  'ECE',
  'EEE',
];

const RESOURCE_TYPES: ResourceType[] = ['Notes', 'Textbooks', 'Question Banks', 'Lab Manuals'];

interface DigitalLibraryItem {
  id: string;
  title: string;
  authors: string;
  isbn: string;
  category: string;
  access: string;
  physicalCopies: string;
}

const DEFAULT_DIGITAL_LIBRARY: DigitalLibraryItem[] = [
  {
    id: 'DL-01',
    title: 'Introduction to Algorithms (CLRS 4th Edition)',
    authors: 'Cormen, Leiserson, Rivest, Stein',
    isbn: '978-0262046305',
    category: 'Computer Science',
    access: 'Full Digital Access (PDF / EPUB)',
    physicalCopies: '14 Available in Central Library Rack C-4',
  },
  {
    id: 'DL-02',
    title: 'Signals and Systems (2nd International Edition)',
    authors: 'Alan V. Oppenheim, Alan S. Willsky',
    isbn: '978-0138147570',
    category: 'Electronics & Communication',
    access: 'Full Digital Access (PDF)',
    physicalCopies: '8 Available in Central Library Rack E-2',
  },
  {
    id: 'DL-03',
    title: 'Artificial Intelligence: A Modern Approach (4th Edition)',
    authors: 'Stuart Russell, Peter Norvig',
    isbn: '978-0134610993',
    category: 'AI & Data Science',
    access: 'Full Digital Access (Interactive eBook)',
    physicalCopies: '12 Available in Central Library Rack AI-1',
  },
  {
    id: 'DL-04',
    title: 'University Physics with Modern Physics (15th Edition)',
    authors: 'Young & Freedman',
    isbn: '978-0135159553',
    category: 'Basic Sciences',
    access: 'Full Digital Access',
    physicalCopies: '22 Available in Ground Floor Stack B',
  },
];

export const AcademicVault: React.FC<AcademicVaultProps> = ({ currentUser, onOpenAuth }) => {
  const [resources, setResources] = useState<AcademicResource[]>([]);
  const [activeTab, setActiveTab] = useState<'vault' | 'digitallibrary'>('vault');

  // Year Selection: 1, 2, 3, 4
  const [selectedYear, setSelectedYear] = useState<number>(1);
  const [selectedCycle, setSelectedCycle] = useState<AcademicCycle>('P');
  const [selectedSemester, setSelectedSemester] = useState<number>(3);
  const [selectedStream, setSelectedStream] = useState<EngineeringStream>('CSE');

  const [selectedType, setSelectedType] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [previewResource, setPreviewResource] = useState<AcademicResource | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<AcademicResource | null>(null);

  // Digital Library Catalog state (wrapped in try/catch safe storage)
  const [libraryCatalog, setLibraryCatalog] = useState<DigitalLibraryItem[]>(() => {
    return safeGetJson<DigitalLibraryItem[]>('campusone_digital_library_items', DEFAULT_DIGITAL_LIBRARY);
  });
  const [isAddLibraryModalOpen, setIsAddLibraryModalOpen] = useState(false);
  const [libBookTitle, setLibBookTitle] = useState('');
  const [libBookAuthors, setLibBookAuthors] = useState('');
  const [libBookIsbn, setLibBookIsbn] = useState('');
  const [libBookCategory, setLibBookCategory] = useState('Computer Science');
  const [libBookLocation, setLibBookLocation] = useState('Central Library Rack A-1');

  // Form states for Curriculum Vault Add / Edit
  const [formTitle, setFormTitle] = useState('');
  const [formSubjectCode, setFormSubjectCode] = useState('');
  const [formSubjectName, setFormSubjectName] = useState('');
  const [formType, setFormType] = useState<ResourceType>('Notes');
  const [formDescription, setFormDescription] = useState('');
  const [formFileSize, setFormFileSize] = useState('12.5 MB');

  // Digital Library Search
  const [libraryQuery, setLibraryQuery] = useState('');

  // Subscribe to live resources
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'vault_resources'), snapshot => {
      const list: AcademicResource[] = snapshot.docs.map(d => d.data() as AcademicResource);
      setResources(list);
    });
    return () => unsub();
  }, []);

  // Requirement 4: STRICT ADMIN-ONLY UPLOADS
  // "This 'Add Resource' feature must be strictly restricted so that ONLY Admins can see and use it."
  const isAdmin = currentUser?.role === 'Admin';
  const canManageResources = isAdmin;

  // Handle year switch
  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    if (year === 1) {
      // Keep cycle
    } else if (year === 2) {
      setSelectedSemester(3);
    } else if (year === 3) {
      setSelectedSemester(5);
    } else if (year === 4) {
      setSelectedSemester(7);
    }
  };

  // Filter resources
  const filteredResources = resources.filter(res => {
    if (selectedYear === 1) {
      if (res.year !== 1) return false;
      if (res.cycle && res.cycle !== selectedCycle) return false;
    } else {
      if (res.year !== selectedYear) return false;
      if (res.semester && res.semester !== selectedSemester) return false;
      if (res.stream && res.stream !== selectedStream) return false;
    }

    if (selectedType !== 'All' && res.type !== selectedType) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        res.title.toLowerCase().includes(q) ||
        res.subjectName.toLowerCase().includes(q) ||
        res.subjectCode.toLowerCase().includes(q) ||
        res.description.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  const handleDownload = async (resource: AcademicResource) => {
    const newCount = (resource.downloadsCount || 0) + 1;
    await updateDoc(doc(db, 'vault_resources', resource.id), {
      downloadsCount: newCount,
    });
    alert(`📥 Downloading: "${resource.title}" (${resource.fileSize})\nSaved to your university offline downloads.`);
  };

  const handleDelete = async (id: string) => {
    if (!canManageResources) return;
    if (confirm('Are you sure you want to permanently delete this academic resource?')) {
      await deleteDoc(doc(db, 'vault_resources', id));
    }
  };

  const handleOpenAddModal = () => {
    if (!isAdmin) return;
    setEditingResource(null);
    setFormTitle('');
    setFormSubjectCode(selectedYear === 1 ? '26PHY101' : '26CSE301');
    setFormSubjectName(selectedYear === 1 ? 'Applied Engineering Physics' : 'Data Structures & Algorithms');
    setFormType('Notes');
    setFormDescription('');
    setFormFileSize('8.4 MB');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (res: AcademicResource) => {
    if (!isAdmin) return;
    setEditingResource(res);
    setFormTitle(res.title);
    setFormSubjectCode(res.subjectCode);
    setFormSubjectName(res.subjectName);
    setFormType(res.type);
    setFormDescription(res.description);
    setFormFileSize(res.fileSize);
    setIsAddModalOpen(true);
  };

  const handleSaveResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !isAdmin) {
      alert('Security error: Only Admins can add or modify resources.');
      return;
    }

    if (!formTitle.trim() || !formSubjectCode.trim() || !formSubjectName.trim()) {
      alert('Please fill out all required fields.');
      return;
    }

    if (editingResource) {
      await updateDoc(doc(db, 'vault_resources', editingResource.id), {
        title: formTitle.trim(),
        subjectCode: formSubjectCode.trim().toUpperCase(),
        subjectName: formSubjectName.trim(),
        type: formType,
        description: formDescription.trim(),
        fileSize: formFileSize,
      });
    } else {
      const newRes: Partial<AcademicResource> = {
        id: `RES-${Date.now().toString().slice(-5)}`,
        title: formTitle.trim(),
        subjectCode: formSubjectCode.trim().toUpperCase(),
        subjectName: formSubjectName.trim(),
        year: selectedYear,
        cycle: selectedYear === 1 ? selectedCycle : undefined,
        semester: selectedYear > 1 ? selectedSemester : undefined,
        stream: selectedYear > 1 ? selectedStream : undefined,
        type: formType,
        fileSize: formFileSize,
        downloadsCount: 0,
        uploadedBy: currentUser.displayName,
        uploadedByRole: currentUser.role,
        uploadedAt: new Date().toISOString().split('T')[0],
        description: formDescription.trim(),
        contentSnippet: `Curriculum reference notes uploaded for Sapthagiri NPS University ${formSubjectName}.`,
      };
      await addDoc(collection(db, 'vault_resources'), newRes);
    }

    setIsAddModalOpen(false);
  };

  const handleSaveDigitalLibraryBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    if (!libBookTitle.trim() || !libBookAuthors.trim()) {
      alert('Please provide book title and author.');
      return;
    }

    const newItem: DigitalLibraryItem = {
      id: `DL-${Date.now().toString().slice(-4)}`,
      title: libBookTitle.trim(),
      authors: libBookAuthors.trim(),
      isbn: libBookIsbn.trim() || '978-0139988221',
      category: libBookCategory,
      access: 'Full Digital Access (PDF / eBook)',
      physicalCopies: `Available in ${libBookLocation.trim()}`,
    };

    const updated = [newItem, ...libraryCatalog];
    setLibraryCatalog(updated);
    safeSetJson('campusone_digital_library_items', updated);

    setIsAddLibraryModalOpen(false);
    setLibBookTitle('');
    setLibBookAuthors('');
    setLibBookIsbn('');
  };

  const filteredLibrary = libraryCatalog.filter(
    b =>
      b.title.toLowerCase().includes(libraryQuery.toLowerCase()) ||
      b.authors.toLowerCase().includes(libraryQuery.toLowerCase()) ||
      b.category.toLowerCase().includes(libraryQuery.toLowerCase())
  );

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              Module 2
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Sapthagiri NPS University Academic Repository
            </span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            Academic Vault
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            Central syllabus repository for notes, textbooks, question banks, lab manuals, and digital library archives.
          </p>
        </div>

        {/* Mode Toggle & Admin-Only Upload Button */}
        <div className="flex items-center gap-3">
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
            <button
              type="button"
              onClick={() => setActiveTab('vault')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'vault'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Curriculum Vault</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('digitallibrary')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'digitallibrary'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Library className="w-3.5 h-3.5" />
              <span>Digital Library</span>
            </button>
          </div>

          {/* REQUIREMENT 4: "Add Resource" must be strictly restricted so that ONLY Admins can see and use it */}
          {isAdmin && (
            <button
              type="button"
              onClick={activeTab === 'vault' ? handleOpenAddModal : () => setIsAddLibraryModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
              title="Admin Only: Add Resource to Vault / Digital Library"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{activeTab === 'vault' ? 'Add Resource (Admin)' : 'Add Library Book (Admin)'}</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'vault' ? (
        <>
          {/* Year Selector Tabs (Year 1, 2, 3, 4) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2">
                Engineering Year:
              </span>
              {[1, 2, 3, 4].map(y => (
                <button
                  key={y}
                  type="button"
                  onClick={() => handleYearChange(y)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    selectedYear === y
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Year {y}
                </button>
              ))}
            </div>

            {/* Sub-selector: Year 1 Cycle or Years 2-4 Semesters & Stream */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
              {selectedYear === 1 ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Cycle Group:
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedCycle('P')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      selectedCycle === 'P'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    ⚡ P (Physics) Cycle
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCycle('E')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      selectedCycle === 'E'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    🔌 E (Electronics) Cycle
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Semester:
                    </span>
                    {(selectedYear === 2
                      ? [3, 4]
                      : selectedYear === 3
                      ? [5, 6]
                      : [7, 8]
                    ).map(sem => (
                      <button
                        key={sem}
                        type="button"
                        onClick={() => setSelectedSemester(sem)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          selectedSemester === sem
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        Semester {sem} (6 Mos)
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mr-1">
                      Stream:
                    </span>
                    <select
                      value={selectedStream}
                      onChange={e => setSelectedStream(e.target.value as EngineeringStream)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden"
                    >
                      {STREAMS.map(stream => (
                        <option key={stream} value={stream}>
                          {stream}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Resource Type Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
                  Type:
                </span>
                <select
                  value={selectedType}
                  onChange={e => setSelectedType(e.target.value)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden"
                >
                  <option value="All">All Types</option>
                  {RESOURCE_TYPES.map(t => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by subject code (e.g. 26PHY101, 26CSE301), topic, or textbook..."
              className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 shadow-xs"
            />
          </div>

          {/* Resources Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredResources.length === 0 ? (
              <div className="col-span-full text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                <FolderOpen className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  No resources uploaded yet for this combination
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {isAdmin
                    ? 'Click [Add Resource (Admin)] above to upload lecture slides or lab guides.'
                    : 'Check another cycle or semester.'}
                </p>
              </div>
            ) : (
              filteredResources.map(res => (
                <div
                  key={res.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all flex flex-col justify-between shadow-xs hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        {res.subjectCode}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                          res.type === 'Lab Manuals'
                            ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200'
                            : res.type === 'Question Banks'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200'
                            : res.type === 'Textbooks'
                            ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200'
                            : 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200'
                        }`}
                      >
                        {res.type}
                      </span>
                    </div>

                    <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                      {res.subjectName}
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 mb-2">
                      {res.title}
                    </h3>

                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 mb-4 leading-relaxed">
                      {res.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 mb-3">
                      <span>{res.fileSize}</span>
                      <span>{res.downloadsCount || 0} downloads</span>
                      <span>Uploaded by: {res.uploadedBy}</span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPreviewResource(res)}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDownload(res)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </button>
                      </div>

                      {/* Edit / Delete actions: STRICTLY for Admins */}
                      {isAdmin && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(res)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            title="Edit Resource (Admin Only)"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(res.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            title="Delete Resource (Admin Only)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        /* Digital Library Section */
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Library className="w-6 h-6 text-indigo-400" />
                <h2 className="text-xl font-black">Sapthagiri NPS University Central Digital Library</h2>
              </div>
              <p className="text-xs text-indigo-200/90 max-w-2xl leading-relaxed">
                Instant digital access to over 45,000 eBooks, IEEE Xplore digital papers, ScienceDirect publications, and real-time physical stack reservation status.
              </p>

              <div className="mt-5 max-w-xl relative">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={libraryQuery}
                  onChange={e => setLibraryQuery(e.target.value)}
                  placeholder="Search across university library catalog by title, author, or ISBN..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-xs text-white placeholder-slate-300 focus:outline-hidden focus:border-white"
                />
              </div>
            </div>

            {/* Requirement 4: In Digital Library, option to add new resource to the vault strictly for Admin */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setIsAddLibraryModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs shadow-lg shadow-indigo-500/30 shrink-0 self-start md:self-auto cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add Resource to Library</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredLibrary.map(book => (
              <div
                key={book.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1">
                    <span>{book.category}</span>
                    <span className="font-mono text-[10px] text-slate-400">ISBN: {book.isbn}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                    {book.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                    By {book.authors}
                  </p>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-[11px] text-slate-700 dark:text-slate-300 space-y-1 mb-4">
                    <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                      ✅ {book.access}
                    </div>
                    <div className="text-slate-500 dark:text-slate-400">
                      📍 {book.physicalCopies}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      alert(`📖 Opened interactive digital viewer for "${book.title}". Available offline for 14 days.`)
                    }
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer"
                  >
                    Read Online
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      alert(`🎟️ Physical Library Reservation Confirmed!\nCollect "${book.title}" from Central Circulation Desk within 48 hours.`)
                    }
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    Reserve Physical Copy
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[85vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setPreviewResource(null)}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                {previewResource.subjectCode}
              </span>
              <span className="text-xs font-bold text-slate-500">
                {previewResource.subjectName}
              </span>
            </div>

            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">
              {previewResource.title}
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Uploaded by {previewResource.uploadedBy} • {previewResource.fileSize}
            </p>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-mono whitespace-pre-wrap">
              {previewResource.contentSnippet || previewResource.description}
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setPreviewResource(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400"
              >
                Close Preview
              </button>
              <button
                type="button"
                onClick={() => handleDownload(previewResource)}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/25 flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Download Full File ({previewResource.fileSize})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Requirement 4: Admin-Only Add/Edit Resource Modal */}
      {isAddModalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingResource ? 'Edit Academic Resource' : 'Publish Resource to Vault'}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Admin Exclusive • Target: Year {selectedYear}
              {selectedYear === 1
                ? ` (${selectedCycle} Cycle)`
                : ` (Semester ${selectedSemester}, Stream ${selectedStream})`}
            </p>

            <form onSubmit={handleSaveResource} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Resource Title *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  placeholder="e.g. Complete Solved DSA Question Bank 2026"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Subject Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formSubjectCode}
                    onChange={e => setFormSubjectCode(e.target.value)}
                    placeholder="26CSE301"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-mono uppercase focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Resource Type *
                  </label>
                  <select
                    value={formType}
                    onChange={e => setFormType(e.target.value as ResourceType)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
                  >
                    {RESOURCE_TYPES.map(t => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Subject Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formSubjectName}
                  onChange={e => setFormSubjectName(e.target.value)}
                  placeholder="Data Structures & Algorithms"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description &amp; Syllabus Coverage
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  placeholder="Key topics, chapters covered, course rubrics..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/25"
                >
                  {editingResource ? 'Save Changes' : 'Upload Resource (Admin)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Requirement 4: Admin-Only Add Digital Library Resource Modal */}
      {isAddLibraryModalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl">
            <button
              type="button"
              onClick={() => setIsAddLibraryModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <Library className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Add Resource to Digital Library
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Admin Exclusive • Publish textbook, research collection, or digital journal.
            </p>

            <form onSubmit={handleSaveDigitalLibraryBook} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Book / Publication Title *
                </label>
                <input
                  type="text"
                  required
                  value={libBookTitle}
                  onChange={e => setLibBookTitle(e.target.value)}
                  placeholder="e.g. Modern Operating Systems (5th Edition)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Author(s) / Editors *
                </label>
                <input
                  type="text"
                  required
                  value={libBookAuthors}
                  onChange={e => setLibBookAuthors(e.target.value)}
                  placeholder="e.g. Andrew S. Tanenbaum, Herbert Bos"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ISBN
                  </label>
                  <input
                    type="text"
                    value={libBookIsbn}
                    onChange={e => setLibBookIsbn(e.target.value)}
                    placeholder="978-0133591620"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-mono focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={libBookCategory}
                    onChange={e => setLibBookCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Electronics & Communication">Electronics &amp; Communication</option>
                    <option value="AI & Data Science">AI &amp; Data Science</option>
                    <option value="Basic Sciences">Basic Sciences</option>
                    <option value="Mechanical & Civil">Mechanical &amp; Civil</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Physical Library Stack Location
                </label>
                <input
                  type="text"
                  value={libBookLocation}
                  onChange={e => setLibBookLocation(e.target.value)}
                  placeholder="Central Library Rack OS-2"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddLibraryModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/25"
                >
                  Add to Library (Admin)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
