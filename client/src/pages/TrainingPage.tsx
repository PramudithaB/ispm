import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { trainingService } from '../services/api';
import { ITrainingModule, TrainingCategory } from '../types';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import {
  GraduationCap,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Search,
  Filter,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const TrainingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [modules, setModules] = useState<ITrainingModule[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const categories: TrainingCategory[] = [
    'Patient Data Confidentiality',
    'Phishing Awareness',
    'Social Engineering',
    'Password Hygiene',
    'Device Security',
    'Physical Security',
  ];

  const fetchModules = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (selectedCategory) params.category = selectedCategory;

      const res = await trainingService.getTrainings(params);
      if (res.data.success) {
        setModules(res.data.trainings);
      }
    } catch (err) {
      console.error('Failed to fetch training modules:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, [searchTerm, selectedCategory]);

  const getStatusBadge = (status?: string, score?: number) => {
    switch (status) {
      case 'Completed':
        return (
          <Badge variant="success" size="sm" dot>
            Passed ({score}%)
          </Badge>
        );
      case 'In Progress':
        return (
          <Badge variant="warning" size="sm">
            In Progress
          </Badge>
        );
      case 'Overdue':
        return (
          <Badge variant="danger" size="sm">
            Overdue
          </Badge>
        );
      default:
        return (
          <Badge variant="neutral" size="sm">
            Not Started
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Security Awareness Training & Quizzes
            </h1>
            <Badge variant="purple" size="sm">
              {modules.length} Modules
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Mandatory information security courses for hospital staff with interactive knowledge quizzes (80% passing grade required).
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search modules by topic..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full md:w-auto px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Modules Grid */}
      {isLoading ? (
        <LoadingSpinner message="Loading training modules..." />
      ) : modules.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center">
          <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No Training Modules Found</h3>
          <p className="text-xs text-slate-400 mt-1">Try clearing your search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => (
            <div
              key={module._id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-card hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between overflow-hidden group"
            >
              <div className="p-6">
                {/* Top badges */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] font-bold text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200/60 truncate">
                    {module.category}
                  </span>
                  {getStatusBadge(module.userStatus, module.userScore)}
                </div>

                <Link
                  to={`/training/${module._id}`}
                  className="text-base font-bold text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-2"
                >
                  {module.title}
                </Link>

                <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                  {module.description}
                </p>

                {/* Progress bar if in progress or completed */}
                {module.userScore !== undefined && module.userScore > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium mb-1">
                      <span>Quiz Score</span>
                      <span className="font-bold text-slate-800">{module.userScore}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          module.userScore >= module.passingScore
                            ? 'bg-emerald-500'
                            : 'bg-amber-500'
                        }`}
                        style={{ width: `${module.userScore}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="px-6 py-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{module.durationMinutes} mins</span>
                  <span className="text-slate-300">•</span>
                  <span>Pass: {module.passingScore}%</span>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/training/${module._id}`}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm ${
                      module.userStatus === 'Completed'
                        ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        : 'bg-brand-600 text-white hover:bg-brand-700 shadow-brand-500/20'
                    }`}
                  >
                    {module.userStatus === 'Completed' ? (
                      <>
                        <BookOpen className="w-3.5 h-3.5" /> Review
                      </>
                    ) : module.userStatus === 'In Progress' ? (
                      <>
                        <Play className="w-3.5 h-3.5" /> Continue
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" /> Start Course
                      </>
                    )}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
