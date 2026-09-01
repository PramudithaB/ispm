import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { trainingService } from '../services/api';
import { ITrainingModule } from '../types';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import {
  GraduationCap,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  BookOpen,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Play,
  RotateCcw,
  FileText,
  Download,
  ExternalLink,
  Edit3,
  Trash2,
} from 'lucide-react';

export const TrainingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isAdminOrSecurity } = useAuth();
  const navigate = useNavigate();

  const [module, setModule] = useState<ITrainingModule | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchTraining = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const res = await trainingService.getTrainingById(id);
      if (res.data.success) {
        setModule(res.data.training);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTraining();
  }, [id]);

  const handleDeleteModule = async () => {
    if (!module) return;
    if (!confirm(`Are you sure you want to permanently delete "${module.title}"?`)) {
      return;
    }
    try {
      await trainingService.deleteTraining(module._id);
      navigate('/training');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete module.');
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading training course content..." />;
  }

  if (!module) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">Training Module Not Found</h3>
        <Link
          to="/training"
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Training Library
        </Link>
      </div>
    );
  }

  const isCompleted = module.progress?.status === 'Completed';
  const score = module.progress?.score || 0;

  // Content extraction helper
  const isStructuredContent = typeof module.content === 'object' && module.content?.sections;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top Header Navigation & Admin Actions */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => navigate('/training')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-brand-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Training Library
        </button>

        {isAdminOrSecurity && (
          <div className="flex items-center gap-2">
            <Link
              to={`/training/${module._id}/quiz`}
              className="px-3 py-1.5 rounded-xl border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <HelpCircle className="w-4 h-4" /> Manage Quiz ({module.questionCount || 0} Questions)
            </Link>
            <button
              onClick={handleDeleteModule}
              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
              title="Delete Module"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Course Header Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-hemas-navy via-slate-900 to-brand-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Badge variant="purple" size="sm">
            {module.category}
          </Badge>
          <Badge variant="teal" size="sm">
            {module.durationMinutes} Minutes
          </Badge>
          {isCompleted && (
            <Badge variant="success" size="sm" dot>
              Passed with {score}%
            </Badge>
          )}
          {module.pdfFilePath && (
            <span className="text-[11px] font-bold text-rose-300 bg-rose-950/60 px-2.5 py-0.5 rounded-full border border-rose-500/40 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> PDF Guide Attached
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          {module.title}
        </h1>

        <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed max-w-2xl">
          {module.description}
        </p>

        <div className="flex flex-wrap items-center gap-4 mt-6 pt-6 border-t border-white/10 text-xs text-slate-300">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-brand-400" />
            <span>Estimated Duration: {module.durationMinutes} mins</span>
          </div>
          <div className="flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-emerald-400" />
            <span>Passing Grade: {module.passingScore}% on Knowledge Quiz</span>
          </div>
          {module.progress?.attempts ? (
            <div className="flex items-center gap-1.5">
              <RotateCcw className="w-4 h-4 text-purple-400" />
              <span>Attempts Taken: {module.progress.attempts}</span>
            </div>
          ) : null}
        </div>
      </div>

      {/* ATTACHED PDF DOCUMENT BANNER */}
      {module.pdfFilePath && (
        <div className="bg-gradient-to-r from-rose-50 to-orange-50/50 rounded-2xl p-5 border border-rose-200/80 shadow-card flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Official PDF Training Material & Study Guide
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                {module.pdfFileName || 'training-guidelines.pdf'}
              </p>
            </div>
          </div>

          <a
            href={module.pdfFilePath}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition-all flex items-center justify-center gap-2 shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Open / Download PDF</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </a>
        </div>
      )}

      {/* Module Content */}
      {isStructuredContent ? (
        <>
          {/* Structured: Course Introduction */}
          {module.content.introduction && (
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-card">
              <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-brand-600" />
                Course Introduction
              </h2>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {module.content.introduction}
              </p>
            </div>
          )}

          {/* Structured Learning Sections */}
          {module.content.sections && module.content.sections.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 px-1">
                <ShieldCheck className="w-5 h-5 text-brand-600" />
                Core Security Learning Modules
              </h2>

              {module.content.sections.map((sec, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card"
                >
                  <h3 className="text-sm font-bold text-slate-900 mb-2">
                    {sec.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                    {sec.body}
                  </p>

                  {sec.highlights && sec.highlights.length > 0 && (
                    <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200/60">
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Key Rules to Remember:
                      </p>
                      <ul className="space-y-1.5 text-xs text-slate-700">
                        {sec.highlights.map((h, hIdx) => (
                          <li key={hIdx} className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Clinical Hospital Security Scenarios */}
          {module.content.examples && module.content.examples.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 px-1">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Hospital Security Scenarios & Correct Protocol
              </h2>

              <div className="grid grid-cols-1 gap-4">
                {module.content.examples.map((ex, exIdx) => (
                  <div
                    key={exIdx}
                    className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-bold text-slate-800">
                        Scenario #{exIdx + 1}
                      </span>
                      <Badge
                        variant={
                          ex.riskLevel === 'Critical'
                            ? 'danger'
                            : ex.riskLevel === 'High'
                            ? 'warning'
                            : 'neutral'
                        }
                        size="sm"
                      >
                        Risk: {ex.riskLevel}
                      </Badge>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-medium mb-3">
                      "{ex.scenario}"
                    </div>

                    <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900">
                      <p className="font-bold flex items-center gap-1.5 text-emerald-800 mb-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Required Security Protocol:
                      </p>
                      <p>{ex.correctAction}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        /* Plain Text or Markdown Content */
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-card">
          <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-brand-600" />
            Module Learning Material
          </h2>
          <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            {typeof module.content === 'string'
              ? module.content
              : (module.content as any)?.text || module.description}
          </div>
        </div>
      )}

      {/* CTA Box to Start / Retake Quiz */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-card flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            {isCompleted ? 'Review Knowledge Quiz' : 'Ready for the Assessment?'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Passing requirement: {module.passingScore}% minimum score. Immediate automated grading and explanations.
          </p>
          {isCompleted && (
            <p className="text-xs font-semibold text-emerald-600 mt-1">
              ✓ Module completed. You can retake the quiz anytime to refresh your knowledge.
            </p>
          )}
        </div>

        <Link
          to={`/training/${module._id}/quiz`}
          className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-lg shadow-brand-500/20 transition-all flex items-center gap-2 shrink-0"
        >
          <Play className="w-4 h-4" />
          <span>{isCompleted ? 'Retake Quiz' : 'Start Knowledge Quiz'}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
