import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { trainingService } from '../services/api';
import { IQuiz, IQuizSubmissionResult, IQuizQuestion } from '../types';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import confetti from 'canvas-confetti';
import {
  HelpCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  Award,
  AlertTriangle,
  Send,
  BookOpen,
  Plus,
  Trash2,
  Edit3,
  Save,
  Settings,
  Layers,
  Check,
} from 'lucide-react';

interface EditableQuestion {
  questionId: string;
  question: string;
  options: [string, string, string, string];
  correctAnswer: number;
  explanation: string;
}

export const QuizPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isAdminOrSecurity } = useAuth();
  const navigate = useNavigate();

  // Active Tab for Admin (Take Quiz vs Manage Quiz)
  const [activeTab, setActiveTab] = useState<'take' | 'manage'>('take');

  // Staff Quiz State
  const [quiz, setQuiz] = useState<IQuiz | null>(null);
  const [trainingTitle, setTrainingTitle] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionResult, setSubmissionResult] = useState<IQuizSubmissionResult | null>(null);

  // Admin Quiz Builder State
  const [adminQuestions, setAdminQuestions] = useState<EditableQuestion[]>([]);
  const [adminPassingScore, setAdminPassingScore] = useState<number>(70);
  const [isSavingQuiz, setIsSavingQuiz] = useState<boolean>(false);
  const [adminMessage, setAdminMessage] = useState<string>('');
  const [adminError, setAdminError] = useState<string>('');

  const fetchQuizData = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const [quizRes, trainingRes] = await Promise.all([
        trainingService.getQuiz(id).catch(() => ({ data: { success: false, quiz: null } })),
        trainingService.getTrainingById(id),
      ]);

      if (quizRes.data.success && quizRes.data.quiz) {
        setQuiz(quizRes.data.quiz);
      } else {
        setQuiz(null);
      }

      if (trainingRes.data.success) {
        setTrainingTitle(trainingRes.data.training.title);
        setAdminPassingScore(trainingRes.data.training.passingScore || 70);
      }

      // If Admin, also fetch admin-quiz with answer keys
      if (isAdminOrSecurity) {
        try {
          const adminRes = await trainingService.getAdminQuiz(id);
          if (adminRes.data.success && adminRes.data.quiz) {
            const rawQuestions = adminRes.data.quiz.questions || [];
            setAdminQuestions(
              rawQuestions.map((q: any, idx: number) => ({
                questionId: q.questionId || `q${idx + 1}`,
                question: q.question || '',
                options: [
                  q.options?.[0] || '',
                  q.options?.[1] || '',
                  q.options?.[2] || '',
                  q.options?.[3] || '',
                ],
                correctAnswer: Number(q.correctAnswer) || 0,
                explanation: q.explanation || '',
              }))
            );
            if (adminRes.data.quiz.passingScore) {
              setAdminPassingScore(adminRes.data.quiz.passingScore);
            }
          }
        } catch (adminErr) {
          console.warn('Failed to load admin quiz data:', adminErr);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizData();
  }, [id, isAdminOrSecurity]);

  // ----------------------------------------------------
  // STAFF QUIZ HANDLERS
  // ----------------------------------------------------
  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (submissionResult) return; // Locked once submitted
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!quiz || !id) return;

    // Check unanswered questions
    const unanswered = quiz.questions.filter(
      (q) => selectedAnswers[q.questionId] === undefined
    );

    if (unanswered.length > 0) {
      if (
        !confirm(
          `You have ${unanswered.length} unanswered question(s). Are you sure you want to submit?`
        )
      ) {
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const answersPayload = quiz.questions.map((q) => ({
        questionId: q.questionId,
        selectedOption:
          selectedAnswers[q.questionId] !== undefined
            ? selectedAnswers[q.questionId]
            : -1,
      }));

      const res = await trainingService.submitQuiz(id, { answers: answersPayload });
      if (res.data.success) {
        setSubmissionResult(res.data.result);

        // Confetti celebration if passed!
        if (res.data.result.passed) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit quiz.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetake = () => {
    setSelectedAnswers({});
    setSubmissionResult(null);
    setCurrentQuestionIndex(0);
  };

  // ----------------------------------------------------
  // ADMIN QUIZ BUILDER HANDLERS
  // ----------------------------------------------------
  const handleAddQuestion = () => {
    const nextIdx = adminQuestions.length + 1;
    setAdminQuestions((prev) => [
      ...prev,
      {
        questionId: `q${Date.now()}`,
        question: `Question ${nextIdx}`,
        options: [
          'Option A',
          'Option B',
          'Option C',
          'Option D',
        ],
        correctAnswer: 0,
        explanation: 'Explanation of the correct answer...',
      },
    ]);
  };

  const handleUpdateQuestionText = (index: number, val: string) => {
    setAdminQuestions((prev) => {
      const updated = [...prev];
      updated[index].question = val;
      return updated;
    });
  };

  const handleUpdateOption = (qIndex: number, optIndex: number, val: string) => {
    setAdminQuestions((prev) => {
      const updated = [...prev];
      const newOptions = [...updated[qIndex].options] as [string, string, string, string];
      newOptions[optIndex] = val;
      updated[qIndex].options = newOptions;
      return updated;
    });
  };

  const handleUpdateCorrectAnswer = (qIndex: number, optIndex: number) => {
    setAdminQuestions((prev) => {
      const updated = [...prev];
      updated[qIndex].correctAnswer = optIndex;
      return updated;
    });
  };

  const handleUpdateExplanation = (qIndex: number, val: string) => {
    setAdminQuestions((prev) => {
      const updated = [...prev];
      updated[qIndex].explanation = val;
      return updated;
    });
  };

  const handleDeleteQuestion = (index: number) => {
    setAdminQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveAdminQuiz = async () => {
    if (!id) return;
    setAdminError('');
    setAdminMessage('');

    if (adminQuestions.length === 0) {
      setAdminError('Please add at least one question before saving the quiz.');
      return;
    }

    // Validate that questions and options are non-empty
    for (let i = 0; i < adminQuestions.length; i++) {
      const q = adminQuestions[i];
      if (!q.question.trim()) {
        setAdminError(`Question #${i + 1} cannot be empty.`);
        return;
      }
      for (let j = 0; j < 4; j++) {
        if (!q.options[j]?.trim()) {
          setAdminError(`Question #${i + 1}, Option ${String.fromCharCode(65 + j)} cannot be empty.`);
          return;
        }
      }
    }

    setIsSavingQuiz(true);
    try {
      const res = await trainingService.saveAdminQuiz(id, {
        passingScore: adminPassingScore,
        questions: adminQuestions,
      });

      if (res.data.success) {
        setAdminMessage('Quiz and questions saved successfully to MySQL!');
        await fetchQuizData();
      }
    } catch (err: any) {
      setAdminError(err.response?.data?.message || 'Failed to save quiz.');
    } finally {
      setIsSavingQuiz(false);
    }
  };

  const handleDeleteEntireQuiz = async () => {
    if (!id) return;
    if (!confirm('Are you sure you want to delete this entire quiz? All questions and attempts will be removed.')) {
      return;
    }

    try {
      await trainingService.deleteQuiz(id);
      setAdminQuestions([]);
      setQuiz(null);
      setAdminMessage('Quiz removed successfully.');
    } catch (err: any) {
      setAdminError(err.response?.data?.message || 'Failed to delete quiz.');
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading quiz assessment..." />;
  }

  const optionLetters = ['A', 'B', 'C', 'D'];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header & Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to={`/training/${id}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-brand-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Course Overview
        </Link>

        {isAdminOrSecurity && (
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('take')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'take'
                  ? 'bg-white text-brand-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Preview Quiz</span>
            </button>
            <button
              onClick={() => setActiveTab('manage')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'manage'
                  ? 'bg-white text-brand-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Manage Questions ({adminQuestions.length})</span>
            </button>
          </div>
        )}
      </div>

      {/* ADMIN QUIZ BUILDER VIEW */}
      {isAdminOrSecurity && activeTab === 'manage' ? (
        <div className="space-y-6">
          {/* Admin Header */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <HelpCircle className="w-6 h-6 text-purple-600" />
                  Quiz Management: {trainingTitle}
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Create and manage multiple-choice questions (Option A, B, C, D) and select the correct answer key.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-700">Passing Grade:</span>
                  <input
                    type="number"
                    min={50}
                    max={100}
                    value={adminPassingScore}
                    onChange={(e) => setAdminPassingScore(Number(e.target.value))}
                    className="w-14 px-2 py-1 text-xs font-bold text-slate-900 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 text-center"
                  />
                  <span className="text-xs font-bold text-slate-600">%</span>
                </div>

                <button
                  onClick={handleAddQuestion}
                  className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-500/20 flex items-center gap-1.5 transition-all"
                >
                  <Plus className="w-4 h-4" /> Add Question
                </button>
              </div>
            </div>

            {adminMessage && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{adminMessage}</span>
              </div>
            )}

            {adminError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{adminError}</span>
              </div>
            )}
          </div>

          {/* Question List */}
          {adminQuestions.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center">
              <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700">No Questions Added Yet</h3>
              <p className="text-xs text-slate-400 mt-1 mb-4">
                Click "Add Question" to create your first multiple-choice quiz question.
              </p>
              <button
                onClick={handleAddQuestion}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold"
              >
                <Plus className="w-4 h-4" /> Add Question #1
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {adminQuestions.map((q, qIdx) => (
                <div
                  key={q.questionId || qIdx}
                  className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card space-y-4"
                >
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                      Question #{qIdx + 1}
                    </span>

                    <button
                      onClick={() => handleDeleteQuestion(qIdx)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
                    >
                      <Trash2 className="w-4 h-4" /> Remove
                    </button>
                  </div>

                  {/* Question Text */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Question Prompt *
                    </label>
                    <input
                      type="text"
                      value={q.question}
                      onChange={(e) => handleUpdateQuestionText(qIdx, e.target.value)}
                      placeholder="e.g. What is the mandatory procedure when leaving a clinical computer unattended?"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>

                  {/* Options A, B, C, D */}
                  <div className="space-y-2.5">
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      Answer Choices (Click radio to set correct answer) *
                    </label>

                    {optionLetters.map((letter, optIdx) => (
                      <div
                        key={optIdx}
                        className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                          q.correctAnswer === optIdx
                            ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-400'
                            : 'bg-slate-50/60 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`correct-${qIdx}`}
                          checked={q.correctAnswer === optIdx}
                          onChange={() => handleUpdateCorrectAnswer(qIdx, optIdx)}
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span className="w-6 h-6 rounded-lg bg-slate-200/80 text-slate-700 text-xs font-bold flex items-center justify-center shrink-0">
                          {letter}
                        </span>
                        <input
                          type="text"
                          value={q.options[optIdx] || ''}
                          onChange={(e) => handleUpdateOption(qIdx, optIdx, e.target.value)}
                          placeholder={`Enter answer option ${letter}...`}
                          className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                        />
                        {q.correctAnswer === optIdx && (
                          <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 shrink-0 px-2 py-0.5 bg-emerald-100 rounded-md">
                            <Check className="w-3 h-3" /> Correct Answer
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Explanation */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Explanation (Shown to staff after submission)
                    </label>
                    <textarea
                      rows={2}
                      value={q.explanation || ''}
                      onChange={(e) => handleUpdateExplanation(qIdx, e.target.value)}
                      placeholder="Explain why the correct answer is right and why other choices are security risks..."
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none text-slate-700"
                    />
                  </div>
                </div>
              ))}

              {/* Bottom Action Toolbar */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  onClick={handleDeleteEntireQuiz}
                  className="text-xs font-bold text-rose-600 hover:text-rose-800 transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" /> Delete Entire Quiz
                </button>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={handleAddQuestion}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Add Question
                  </button>
                  <button
                    onClick={handleSaveAdminQuiz}
                    disabled={isSavingQuiz}
                    className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-lg shadow-purple-500/20 transition-all flex items-center gap-2 disabled:opacity-60"
                  >
                    {isSavingQuiz ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Saving Questions to MySQL...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save Quiz to Database</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* STAFF TEST-TAKING & RESULT VIEW */
        <div className="space-y-6">
          {/* Banner */}
          <div className="rounded-3xl bg-gradient-to-br from-hemas-navy via-slate-900 to-brand-950 p-6 sm:p-8 text-white shadow-xl">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge variant="purple" size="sm">
                Knowledge Assessment
              </Badge>
              {quiz && (
                <Badge variant="teal" size="sm">
                  Pass Mark: {quiz.passingScore}%
                </Badge>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {trainingTitle || 'Training Knowledge Quiz'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2">
              Answer all multiple-choice questions (A, B, C, D) to demonstrate compliance with hospital security standards.
            </p>
          </div>

          {!quiz || quiz.questions.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center">
              <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700">No Quiz Available</h3>
              <p className="text-xs text-slate-400 mt-1">
                The administrator has not yet attached questions to this training module.
              </p>
            </div>
          ) : submissionResult ? (
            /* SUBMISSION RESULT CARD */
            <div className="space-y-6 animate-in zoom-in-95 duration-200">
              <div
                className={`rounded-3xl p-6 sm:p-8 border shadow-xl text-center ${
                  submissionResult.passed
                    ? 'bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white border-emerald-200'
                    : 'bg-gradient-to-br from-rose-50 via-amber-50/50 to-white border-rose-200'
                }`}
              >
                <div
                  className={`w-16 h-16 rounded-3xl mx-auto flex items-center justify-center mb-4 shadow-lg ${
                    submissionResult.passed
                      ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                      : 'bg-rose-500 text-white shadow-rose-500/30'
                  }`}
                >
                  {submissionResult.passed ? (
                    <Award className="w-8 h-8" />
                  ) : (
                    <XCircle className="w-8 h-8" />
                  )}
                </div>

                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 ${
                    submissionResult.passed
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {submissionResult.passed ? 'Assessment Passed' : 'Assessment Not Passed'}
                </span>

                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  Your Score: {submissionResult.score}%
                </h2>

                <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-md mx-auto">
                  {submissionResult.passed
                    ? `Congratulations! You answered ${submissionResult.correctCount} of ${submissionResult.totalQuestions} questions correctly and met the ${submissionResult.passingScore}% passing threshold.`
                    : `You scored ${submissionResult.score}%, but ${submissionResult.passingScore}% is required to complete this module. Review the question explanations below and retry the quiz.`}
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3 mt-6 pt-6 border-t border-slate-200/60">
                  <button
                    onClick={handleRetake}
                    className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-500/20 transition-all flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Retake Quiz</span>
                  </button>

                  <Link
                    to="/training"
                    className="px-5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-2"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Return to Library</span>
                  </Link>
                </div>
              </div>

              {/* Question-by-Question Review with Explanations */}
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900 px-1">
                  Assessment Detailed Review & Explanations
                </h3>

                {submissionResult.questions.map((q, idx) => (
                  <div
                    key={idx}
                    className={`rounded-2xl p-6 border bg-white shadow-card ${
                      q.isCorrect ? 'border-emerald-200' : 'border-rose-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-bold text-slate-800">
                        Question #{idx + 1}
                      </span>
                      <Badge variant={q.isCorrect ? 'success' : 'danger'} size="sm">
                        {q.isCorrect ? 'Correct' : 'Incorrect'}
                      </Badge>
                    </div>

                    <p className="text-xs sm:text-sm font-semibold text-slate-900 mb-3">
                      {q.question}
                    </p>

                    <div className="space-y-2 mb-4">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = q.selectedOption === optIdx;
                        const isCorrectAnswer = q.correctAnswer === optIdx;

                        return (
                          <div
                            key={optIdx}
                            className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 ${
                              isCorrectAnswer
                                ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-bold'
                                : isSelected && !isCorrectAnswer
                                ? 'bg-rose-50/80 border-rose-300 text-rose-950 font-medium'
                                : 'bg-slate-50/60 border-slate-200 text-slate-600'
                            }`}
                          >
                            <span className="w-5 h-5 rounded-md bg-white border border-slate-200 text-[10px] font-bold flex items-center justify-center shrink-0">
                              {optionLetters[optIdx]}
                            </span>
                            <span className="flex-1">{opt}</span>
                            {isCorrectAnswer && (
                              <span className="text-emerald-600 text-[11px] font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                              </span>
                            )}
                            {isSelected && !isCorrectAnswer && (
                              <span className="text-rose-600 text-[11px] font-bold flex items-center gap-1">
                                <XCircle className="w-3.5 h-3.5" /> Your Choice
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {q.explanation && (
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                        <p className="font-bold text-slate-900 mb-0.5">Security Explanation:</p>
                        <p>{q.explanation}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* ACTIVE QUIZ QUESTION TAKING INTERFACE */
            <div className="space-y-6">
              {/* Progress Tracker */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <span>Question {currentQuestionIndex + 1} of {quiz.questions.length}</span>
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  {Object.keys(selectedAnswers).length} of {quiz.questions.length} Answered
                </div>
              </div>

              {/* Active Question Box */}
              {quiz.questions[currentQuestionIndex] && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-card space-y-6">
                  <div>
                    <span className="text-[11px] font-bold text-brand-600 uppercase tracking-wider bg-brand-50 px-2.5 py-1 rounded-md">
                      Multiple Choice Question #{currentQuestionIndex + 1}
                    </span>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-3 leading-relaxed">
                      {quiz.questions[currentQuestionIndex].question}
                    </h2>
                  </div>

                  {/* 4 Choices (A, B, C, D) */}
                  <div className="space-y-3">
                    {quiz.questions[currentQuestionIndex].options.map((opt, optIdx) => {
                      const questionId = quiz.questions[currentQuestionIndex].questionId;
                      const isSelected = selectedAnswers[questionId] === optIdx;

                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => handleSelectOption(questionId, optIdx)}
                          className={`w-full p-4 rounded-2xl border text-left text-xs sm:text-sm font-medium transition-all flex items-center gap-3.5 ${
                            isSelected
                              ? 'bg-brand-50/80 border-brand-500 text-brand-950 ring-2 ring-brand-500/20 shadow-sm'
                              : 'bg-slate-50/50 border-slate-200/80 hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <span
                            className={`w-7 h-7 rounded-xl text-xs font-bold flex items-center justify-center shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-brand-600 text-white'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {optionLetters[optIdx]}
                          </span>
                          <span className="flex-1">{opt}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Navigation Buttons between questions */}
                  <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                    <button
                      type="button"
                      disabled={currentQuestionIndex === 0}
                      onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-40 flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-4 h-4" /> Previous
                    </button>

                    {currentQuestionIndex < quiz.questions.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                        className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-500/20 transition-all flex items-center gap-1.5"
                      >
                        <span>Next Question</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={handleSubmitQuiz}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-60"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Grading Quiz...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>Submit Assessment</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Question Quick Jump Grid */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Question Quick Jump:
                </p>
                <div className="flex flex-wrap gap-2">
                  {quiz.questions.map((q, idx) => {
                    const isAnswered = selectedAnswers[q.questionId] !== undefined;
                    const isCurrent = currentQuestionIndex === idx;

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCurrentQuestionIndex(idx)}
                        className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                          isCurrent
                            ? 'bg-brand-600 text-white ring-2 ring-brand-500/30'
                            : isAnswered
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
