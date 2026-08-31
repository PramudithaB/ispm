import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { trainingService } from '../services/api';
import { IQuiz, IQuizSubmissionResult } from '../types';
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
} from 'lucide-react';

export const QuizPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<IQuiz | null>(null);
  const [trainingTitle, setTrainingTitle] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionResult, setSubmissionResult] = useState<IQuizSubmissionResult | null>(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const [quizRes, trainingRes] = await Promise.all([
          trainingService.getQuiz(id),
          trainingService.getTrainingById(id),
        ]);

        if (quizRes.data.success) {
          setQuiz(quizRes.data.quiz);
        }
        if (trainingRes.data.success) {
          setTrainingTitle(trainingRes.data.training.title);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuiz();
  }, [id]);

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (submissionResult) return; // Locked once submitted
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!quiz || !id) return;

    // Check if all questions answered
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

  if (isLoading) {
    return <LoadingSpinner message="Preparing security awareness quiz..." />;
  }

  if (!quiz || quiz.questions.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">Quiz Not Found</h3>
        <p className="text-xs text-slate-500 mt-1">
          No questions found for this module.
        </p>
        <Link
          to="/training"
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Training Library
        </Link>
      </div>
    );
  }

  const currentQ = quiz.questions[currentQuestionIndex];
  const progressPercent = Math.round(
    (Object.keys(selectedAnswers).length / quiz.questions.length) * 100
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(`/training/${id}`)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-brand-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Module Overview
        </button>

        <div className="flex items-center gap-2">
          <Badge variant="purple" size="sm">
            Pass Mark: {quiz.passingScore}%
          </Badge>
          <Badge variant="neutral" size="sm">
            {quiz.questions.length} Questions
          </Badge>
        </div>
      </div>

      {/* Quiz Title Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card">
        <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
          {trainingTitle || 'Knowledge Assessment'}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Select the best answer for each question. Answers are securely verified and graded.
        </p>

        {/* Progress Bar (During active quiz) */}
        {!submissionResult && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1.5">
              <span>
                Question {currentQuestionIndex + 1} of {quiz.questions.length}
              </span>
              <span>{progressPercent}% answered</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-brand-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ==================================================== */}
      {/* ACTIVE QUIZ QUESTION VIEW                            */}
      {/* ==================================================== */}
      {!submissionResult ? (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-card space-y-6">
          {/* Question Index Dots */}
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100 overflow-x-auto">
            {quiz.questions.map((q, idx) => (
              <button
                key={q.questionId}
                onClick={() => setCurrentQuestionIndex(idx)}
                className={`w-8 h-8 rounded-xl text-xs font-bold flex items-center justify-center transition-all ${
                  idx === currentQuestionIndex
                    ? 'bg-brand-600 text-white ring-2 ring-brand-300 shadow-sm'
                    : selectedAnswers[q.questionId] !== undefined
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          {/* Question Prompt */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-full">
              Question {currentQuestionIndex + 1}
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-2 leading-snug">
              {currentQ.question}
            </h2>
          </div>

          {/* Options List */}
          <div className="space-y-3">
            {currentQ.options.map((option, optIdx) => {
              const isSelected = selectedAnswers[currentQ.questionId] === optIdx;
              return (
                <div
                  key={optIdx}
                  onClick={() => handleSelectOption(currentQ.questionId, optIdx)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3.5 ${
                    isSelected
                      ? 'bg-brand-50/70 border-brand-500 ring-2 ring-brand-200/60 shadow-sm text-brand-950 font-medium'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 text-slate-800'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                      isSelected
                        ? 'border-brand-600 bg-brand-600 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <span className="text-xs sm:text-sm leading-relaxed">{option}</span>
                </div>
              );
            })}
          </div>

          {/* Bottom Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> Previous
            </button>

            {currentQuestionIndex < quiz.questions.length - 1 ? (
              <button
                onClick={() => setCurrentQuestionIndex((prev) => Math.min(quiz.questions.length - 1, prev + 1))}
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-500/20 transition-all flex items-center gap-1.5"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmitQuiz}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Grading Answers...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit & Grade Quiz</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      ) : (
        /* ==================================================== */
        /* POST-SUBMISSION RESULTS & EXPLANATIONS VIEW          */
        /* ==================================================== */
        <div className="space-y-6">
          {/* Result Score Banner */}
          <div
            className={`rounded-3xl p-6 sm:p-8 text-white shadow-xl text-center ${
              submissionResult.passed
                ? 'bg-gradient-to-br from-emerald-600 to-teal-800'
                : 'bg-gradient-to-br from-amber-600 to-rose-700'
            }`}
          >
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-3 text-white shadow-inner">
              {submissionResult.passed ? (
                <Award className="w-9 h-9" />
              ) : (
                <AlertTriangle className="w-9 h-9" />
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {submissionResult.passed
                ? 'Congratulations! You Passed!'
                : 'Assessment Incomplete / Try Again'}
            </h2>

            <p className="text-xs sm:text-sm text-white/90 mt-1 max-w-md mx-auto">
              {submissionResult.passed
                ? `You scored ${submissionResult.score}% (Passing score: ${submissionResult.passingScore}%). Your training completion has been recorded in the compliance registry.`
                : `You scored ${submissionResult.score}%. A minimum of ${submissionResult.passingScore}% is required to complete this module. Review the explanations below and try again.`}
            </p>

            <div className="mt-6 inline-flex items-center gap-4 bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20">
              <div>
                <span className="text-[11px] text-white/80 block">Score</span>
                <span className="text-lg font-bold">{submissionResult.score}%</span>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div>
                <span className="text-[11px] text-white/80 block">Correct</span>
                <span className="text-lg font-bold">
                  {submissionResult.correctCount} / {submissionResult.totalQuestions}
                </span>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div>
                <span className="text-[11px] text-white/80 block">Attempt</span>
                <span className="text-lg font-bold">#{submissionResult.attempts}</span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-3">
              {!submissionResult.passed && (
                <button
                  onClick={handleRetake}
                  className="px-5 py-2.5 rounded-xl bg-white text-slate-900 text-xs font-bold hover:bg-slate-100 shadow-md transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" /> Retake Quiz Now
                </button>
              )}
              <Link
                to="/training"
                className="px-5 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold backdrop-blur transition-colors flex items-center gap-1.5"
              >
                <BookOpen className="w-4 h-4" /> Return to Training
              </Link>
            </div>
          </div>

          {/* Detailed Question Explanations */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 px-1">
              Detailed Question Review & Clinical Rationales
            </h3>

            {submissionResult.questions.map((q, idx) => (
              <div
                key={q.questionId}
                className={`bg-white rounded-2xl p-6 border shadow-card transition-all ${
                  q.isCorrect ? 'border-emerald-200' : 'border-rose-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-slate-800">
                    Question {idx + 1}
                  </span>
                  {q.isCorrect ? (
                    <Badge variant="success" size="sm" dot>
                      Correct
                    </Badge>
                  ) : (
                    <Badge variant="danger" size="sm" dot>
                      Incorrect
                    </Badge>
                  )}
                </div>

                <h4 className="text-sm font-bold text-slate-900 mb-3">
                  {q.question}
                </h4>

                {/* Options display with correct/wrong highlights */}
                <div className="space-y-2 mb-4">
                  {q.options.map((opt, optIdx) => {
                    const isUserChoice = q.selectedOption === optIdx;
                    const isCorrectAnswer = q.correctAnswer === optIdx;

                    let style = 'bg-slate-50 border-slate-200 text-slate-700';
                    if (isCorrectAnswer) {
                      style = 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold';
                    } else if (isUserChoice && !q.isCorrect) {
                      style = 'bg-rose-50 border-rose-300 text-rose-950 line-through';
                    }

                    return (
                      <div
                        key={optIdx}
                        className={`p-3 rounded-xl border text-xs flex items-center justify-between ${style}`}
                      >
                        <span>{opt}</span>
                        {isCorrectAnswer && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                            Correct Answer
                          </span>
                        )}
                        {isUserChoice && !isCorrectAnswer && (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full shrink-0">
                            Your Selection
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation text */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                  <span className="font-bold text-slate-900 block mb-1">
                    Security Rationale & Explanation:
                  </span>
                  {q.explanation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
