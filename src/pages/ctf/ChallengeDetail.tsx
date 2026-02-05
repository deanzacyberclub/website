import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useOfficerVerification } from "@/hooks/useOfficerVerification";
import { supabase } from "@/lib/supabase";
import {
  ChevronLeft,
  ChevronRight,
  Flag,
  Download,
  Check,
  AlertTriangle,
  Star,
  Trophy,
  Lightbulb,
  Users,
  Edit,
  Trash,
  Document,
} from "@/lib/cyberIcon";
import ConfirmDialog from "@/components/ConfirmDialog";
import {
  categoryInfo,
  difficultyInfo,
  type Challenge,
  type CTFCategory,
  type CTFDifficulty,
} from "./types";

interface TeamInfo {
  id: string;
  name: string;
}

function ChallengeDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, userProfile } = useAuth();
  const { isVerifiedOfficer, isLoading: verifyingOfficer } = useOfficerVerification();
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(false);
  const [flagInput, setFlagInput] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "correct" | "incorrect" | "already_solved"
  >("idle");
  const [isSolved, setIsSolved] = useState(false);
  const [team, setTeam] = useState<TeamInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [allChallenges, setAllChallenges] = useState<Challenge[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  // Use server-verified officer status instead of client-side state
  const isOfficer = isVerifiedOfficer ?? false;

  // Fetch challenge from database
  const fetchChallenge = useCallback(async () => {
    if (!id) return;

    try {
      // For officers: get full challenge data including flag and solution
      // For regular users: use the public view that excludes sensitive data
      const table = isOfficer ? "ctf_challenges" : "ctf_challenges_public";

      const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq("id", id)
        .eq("is_active", true)
        .single();

      if (error || !data) {
        setChallenge(null);
      } else {
        setChallenge({
          ...data,
          files: data.files || [],
        });
      }

      // Fetch all challenges for navigation
      const { data: allData } = await supabase
        .from("ctf_challenges_public")
        .select("id, title, difficulty")
        .order("difficulty")
        .order("title");

      setAllChallenges(allData || []);
    } catch (err) {
      console.error("Error fetching challenge:", err);
    }
  }, [id, isOfficer]);

  useEffect(() => {
    fetchChallenge();
  }, [fetchChallenge]);

  const fetchTeamAndSolveStatus = useCallback(async () => {
    if (!user || !challenge) {
      setLoading(false);
      setLoaded(true);
      return;
    }

    try {
      // Check if user is in a team
      const { data: membership } = await supabase
        .from("ctf_team_members")
        .select("team_id")
        .eq("user_id", user.id)
        .single();

      if (membership) {
        // Fetch team name
        const { data: teamData } = await supabase
          .from("ctf_teams")
          .select("id, name")
          .eq("id", membership.team_id)
          .single();

        if (teamData) {
          setTeam(teamData);

          // Check if team already solved this challenge
          const { data: solveData } = await supabase
            .from("ctf_submissions")
            .select("id")
            .eq("team_id", membership.team_id)
            .eq("challenge_id", challenge.id)
            .eq("is_correct", true)
            .single();

          setIsSolved(!!solveData);
        }
      }
    } catch (err) {
      console.error("Error fetching team status:", err);
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, [user, challenge]);

  useEffect(() => {
    fetchTeamAndSolveStatus();
  }, [fetchTeamAndSolveStatus]);

  useEffect(() => {
    // Reset state when challenge changes
    setFlagInput("");
    setShowHint(false);
    setSubmitStatus("idle");
    setIsSolved(false);
    setLoading(true);
    fetchTeamAndSolveStatus();
  }, [id]);

  if (!challenge) {
    return (
      <div className="min-h-screen bg-terminal-bg text-matrix flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-hack-red mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">
            Challenge Not Found
          </h1>
          <p className="text-gray-400 mb-6">
            The challenge you're looking for doesn't exist.
          </p>
          <Link
            to="/ctf/challenges"
            className="btn-hack-filled rounded-lg px-6 py-3"
          >
            Back to Challenges
          </Link>
        </div>
      </div>
    );
  }

  const isBeast = challenge.difficulty === "beast";

  // Find adjacent challenges for navigation
  const currentIndex = allChallenges.findIndex((c) => c.id === challenge.id);
  const prevChallenge = currentIndex > 0 ? allChallenges[currentIndex - 1] : null;
  const nextChallenge =
    currentIndex < allChallenges.length - 1 ? allChallenges[currentIndex + 1] : null;

  const handleDelete = async () => {
    if (!challenge || !isOfficer) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from("ctf_challenges")
        .update({ is_active: false })
        .eq("id", challenge.id);

      if (error) throw error;

      navigate("/ctf/challenges");
    } catch (err) {
      console.error("Error deleting challenge:", err);
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const getDifficultyColor = (difficulty: CTFDifficulty) => {
    switch (difficulty) {
      case "easy":
        return "text-green-400 border-green-500/30 bg-green-500/10";
      case "medium":
        return "text-yellow-400 border-yellow-500/30 bg-yellow-500/10";
      case "hard":
        return "text-red-400 border-red-500/30 bg-red-500/10";
      case "beast":
        return "text-purple-400 border-purple-500/30 bg-purple-500/10";
    }
  };

  const getCategoryColor = (category: CTFCategory) => {
    switch (category) {
      case "web":
        return "text-cyan-400";
      case "crypto":
        return "text-purple-400";
      case "reverse":
        return "text-orange-400";
      case "forensics":
        return "text-blue-400";
      case "pwn":
        return "text-red-400";
      case "misc":
        return "text-yellow-400";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !team) return;

    try {
      // Use the secure server-side flag verification function
      const { data: isCorrect, error: verifyError } = await supabase
        .rpc('verify_ctf_flag', {
          challenge_id_input: challenge.id,
          submitted_flag_input: flagInput.trim()
        });

      if (verifyError) throw verifyError;

      // Record submission
      const { error } = await supabase.from("ctf_submissions").insert({
        team_id: team.id,
        challenge_id: challenge.id,
        submitted_flag: flagInput.trim(),
        is_correct: isCorrect,
        points_awarded: isCorrect ? challenge.points : 0,
        submitted_by: user.id,
      });

      if (error) {
        // Check if it's a duplicate correct submission
        if (error.message.includes("unique") && isCorrect) {
          setSubmitStatus("already_solved");
          setIsSolved(true);
          return;
        }
        throw error;
      }

      if (isCorrect) {
        setSubmitStatus("correct");
        setIsSolved(true);
      } else {
        setSubmitStatus("incorrect");
        setTimeout(() => setSubmitStatus("idle"), 2000);
      }
    } catch (err) {
      console.error("Error submitting flag:", err);
      setSubmitStatus("incorrect");
      setTimeout(() => setSubmitStatus("idle"), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-terminal-bg text-matrix">
      <div className="crt-overlay" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div
          className={`mb-8 transition-all duration-700 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <Link
            to="/ctf/challenges"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-matrix transition-colors mb-6"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="font-terminal text-sm">Back to Challenges</span>
          </Link>

          <div className="flex flex-wrap items-start gap-4 mb-4">
            {/* Solved Badge */}
            {isSolved && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 border border-green-500/50">
                <Check className="w-4 h-4 text-green-400" />
                <span className="text-green-400 text-sm font-terminal">
                  SOLVED
                </span>
              </div>
            )}

            {/* Beast Badge */}
            {isBeast && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/50 animate-pulse">
                <Star className="w-4 h-4 text-purple-400" />
                <span className="text-purple-400 text-sm font-terminal">
                  LEGENDARY
                </span>
              </div>
            )}

            {/* Category */}
            <span
              className={`text-sm font-terminal ${getCategoryColor(challenge.category)}`}
            >
              {categoryInfo[challenge.category].name}
            </span>

            {/* Difficulty */}
            <span
              className={`px-3 py-1 rounded text-sm font-terminal border ${getDifficultyColor(challenge.difficulty)}`}
            >
              {difficultyInfo[challenge.difficulty].name}
            </span>

            {/* Points */}
            <div className="flex items-center gap-2 text-matrix">
              <Trophy className="w-4 h-4" />
              <span className="font-terminal">{challenge.points} pts</span>
            </div>
          </div>

          <h1
            className={`text-3xl md:text-4xl font-bold ${isBeast ? "neon-text" : ""}`}
          >
            {isBeast && (
              <Star className="inline w-8 h-8 mr-2 text-purple-400" />
            )}
            <span className={isBeast ? "text-purple-400" : "text-white"}>
              {challenge.title}
            </span>
            {isBeast && (
              <Star className="inline w-8 h-8 ml-2 text-purple-400" />
            )}
          </h1>

          {challenge.author && (
            <p className="text-gray-500 text-sm mt-2">
              Created by{" "}
              <span className="text-gray-400">{challenge.author}</span>
            </p>
          )}

          {/* Officer Actions */}
          {isOfficer && (
            <div className="flex items-center gap-3 mt-4">
              <Link
                to={`/ctf/challenge/${challenge.id}/edit`}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 transition-colors text-sm"
              >
                <Edit className="w-4 h-4" />
                Edit Challenge
              </Link>
              <button
                onClick={() => setShowDeleteDialog(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors text-sm"
              >
                <Trash className="w-4 h-4" />
                Delete
              </button>
            </div>
          )}
        </div>

        {/* Challenge Content */}
        <div
          className={`mb-8 transition-all duration-700 delay-100 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <div
            className={`terminal-window ${isBeast ? "border-purple-500/30" : ""}`}
          >
            <div className="terminal-header">
              <div className="terminal-dot red" />
              <div className="terminal-dot yellow" />
              <div className="terminal-dot green" />
              <span className="ml-4 text-xs text-gray-500 font-terminal">
                challenge_description.md
              </span>
            </div>
            <div className="terminal-body">
              <div className="prose prose-invert prose-green max-w-none">
                {challenge.description.split("\n").map((line, i) => {
                  if (line.startsWith("```")) return null;
                  if (line.includes("`")) {
                    const parts = line.split(/(`[^`]+`)/);
                    return (
                      <p key={i} className="text-gray-300 leading-relaxed mb-4">
                        {parts.map((part, j) =>
                          part.startsWith("`") && part.endsWith("`") ? (
                            <code
                              key={j}
                              className="bg-gray-800 px-2 py-1 rounded text-matrix text-sm"
                            >
                              {part.slice(1, -1)}
                            </code>
                          ) : (
                            part
                          ),
                        )}
                      </p>
                    );
                  }
                  if (line.includes("**")) {
                    const parts = line.split(/(\*\*[^*]+\*\*)/);
                    return (
                      <p key={i} className="text-gray-300 leading-relaxed mb-4">
                        {parts.map((part, j) =>
                          part.startsWith("**") && part.endsWith("**") ? (
                            <strong key={j} className="text-matrix font-bold">
                              {part.slice(2, -2)}
                            </strong>
                          ) : (
                            part
                          ),
                        )}
                      </p>
                    );
                  }
                  return line ? (
                    <p key={i} className="text-gray-300 leading-relaxed mb-4">
                      {line}
                    </p>
                  ) : (
                    <br key={i} />
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Files */}
        {challenge.files && challenge.files.length > 0 && (
          <div
            className={`mb-8 transition-all duration-700 delay-150 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <h3 className="text-sm text-gray-500 font-terminal mb-3 flex items-center gap-2">
              <Download className="w-4 h-4" />
              ATTACHMENTS
            </h3>
            <div className="flex flex-wrap gap-3">
              {challenge.files.map((file, i) => (
                <a
                  key={i}
                  href={file.url}
                  download
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800/50 border border-gray-700 hover:border-matrix/50 hover:bg-matrix/5 transition-all group"
                >
                  <Flag className="w-4 h-4 text-gray-500 group-hover:text-matrix transition-colors" />
                  <span className="text-gray-300 group-hover:text-matrix transition-colors">
                    {file.name}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Hint */}
        {challenge.hint && (
          <div
            className={`mb-8 transition-all duration-700 delay-200 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <button
              onClick={() => setShowHint(!showHint)}
              className="flex items-center gap-2 text-yellow-500 hover:text-yellow-400 transition-colors mb-3"
            >
              <Lightbulb className="w-4 h-4" />
              <span className="font-terminal text-sm">
                {showHint ? "Hide Hint" : "Show Hint"}
              </span>
            </button>
            {showHint && (
              <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                <p className="text-yellow-400/80 text-sm">{challenge.hint}</p>
              </div>
            )}
          </div>
        )}

        {/* Solution (Officers Only) */}
        {isOfficer && challenge.solution && (
          <div
            className={`mb-8 transition-all duration-700 delay-200 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <button
              onClick={() => setShowSolution(!showSolution)}
              className="flex items-center gap-2 text-blue-500 hover:text-blue-400 transition-colors mb-3"
            >
              <Document className="w-4 h-4" />
              <span className="font-terminal text-sm">
                {showSolution ? "Hide Solution" : "Show Solution (Officers Only)"}
              </span>
            </button>
            {showSolution && (
              <div className="terminal-window border-blue-500/30">
                <div className="terminal-header">
                  <div className="terminal-dot red" />
                  <div className="terminal-dot yellow" />
                  <div className="terminal-dot green" />
                  <span className="ml-4 text-xs text-gray-500 font-terminal">
                    solution_walkthrough.md
                  </span>
                </div>
                <div className="terminal-body">
                  <div className="prose prose-invert prose-blue max-w-none">
                    {challenge.solution.split("\n").map((line, i) => {
                      // Handle step numbers (e.g., "1.", "2.", etc.)
                      if (/^\d+\./.test(line)) {
                        return (
                          <div key={i} className="flex gap-3 mb-4">
                            <span className="text-blue-400 font-bold font-terminal shrink-0">
                              {line.match(/^\d+\./)?.[0]}
                            </span>
                            <p className="text-gray-300 leading-relaxed">
                              {line.replace(/^\d+\.\s*/, "")}
                            </p>
                          </div>
                        );
                      }
                      // Handle code blocks
                      if (line.includes("`")) {
                        const parts = line.split(/(`[^`]+`)/);
                        return (
                          <p key={i} className="text-gray-300 leading-relaxed mb-4">
                            {parts.map((part, j) =>
                              part.startsWith("`") && part.endsWith("`") ? (
                                <code
                                  key={j}
                                  className="bg-gray-800 px-2 py-1 rounded text-blue-400 text-sm"
                                >
                                  {part.slice(1, -1)}
                                </code>
                              ) : (
                                part
                              ),
                            )}
                          </p>
                        );
                      }
                      // Handle bold text
                      if (line.includes("**")) {
                        const parts = line.split(/(\*\*[^*]+\*\*)/);
                        return (
                          <p key={i} className="text-gray-300 leading-relaxed mb-4">
                            {parts.map((part, j) =>
                              part.startsWith("**") && part.endsWith("**") ? (
                                <strong key={j} className="text-blue-400 font-bold">
                                  {part.slice(2, -2)}
                                </strong>
                              ) : (
                                part
                              ),
                            )}
                          </p>
                        );
                      }
                      return line ? (
                        <p key={i} className="text-gray-300 leading-relaxed mb-4">
                          {line}
                        </p>
                      ) : (
                        <br key={i} />
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Flag Submission */}
        <div
          className={`mb-12 transition-all duration-700 delay-250 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <div
            className={`terminal-window ${
              submitStatus === "correct" || submitStatus === "already_solved"
                ? "border-green-500/50"
                : submitStatus === "incorrect"
                  ? "border-red-500/50"
                  : ""
            }`}
          >
            <div className="terminal-header">
              <div className="terminal-dot red" />
              <div className="terminal-dot yellow" />
              <div className="terminal-dot green" />
              <span className="ml-4 text-xs text-gray-500 font-terminal">
                submit_flag.sh
              </span>
            </div>
            <div className="terminal-body">
              {!user ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-white mb-2">
                    Login Required
                  </h3>
                  <p className="text-gray-400 mb-4">
                    You need to be logged in to submit flags.
                  </p>
                  <Link
                    to="/auth"
                    className="btn-hack-filled rounded-lg px-6 py-3"
                  >
                    Login
                  </Link>
                </div>
              ) : !team ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-white mb-2">
                    Join a Team First
                  </h3>
                  <p className="text-gray-400 mb-4">
                    You must be in a team to submit flags.
                  </p>
                  <Link
                    to="/ctf/team"
                    className="btn-hack-filled rounded-lg px-6 py-3"
                  >
                    Create or Join Team
                  </Link>
                </div>
              ) : submitStatus === "correct" ? (
                <div className="text-center py-8">
                  <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center mx-auto mb-4 animate-bounce">
                    <Check className="w-10 h-10 text-green-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-green-400 mb-2 neon-text-subtle">
                    Correct!
                  </h3>
                  <p className="text-gray-400 mb-4">
                    <span className="text-matrix font-bold">{team.name}</span>{" "}
                    earned{" "}
                    <span className="text-matrix font-bold">
                      {challenge.points}
                    </span>{" "}
                    points!
                  </p>
                  {nextChallenge && (
                    <button
                      onClick={() =>
                        navigate(`/ctf/challenge/${nextChallenge.id}`)
                      }
                      className="btn-hack-filled rounded-lg px-6 py-3 inline-flex items-center gap-2"
                    >
                      Next Challenge
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="flex items-center gap-2 text-gray-500 mb-4">
                    <span className="text-matrix">$</span>
                    <span className="font-terminal">./submit_flag</span>
                    {team && (
                      <span className="text-xs text-gray-600">
                        (as {team.name})
                      </span>
                    )}
                  </div>
                  <div className="flex gap-4">
                    <input
                      type="text"
                      value={flagInput}
                      onChange={(e) => setFlagInput(e.target.value)}
                      placeholder="DACC{your_flag_here}"
                      className={`flex-1 input-hack rounded-lg ${
                        submitStatus === "incorrect"
                          ? "border-red-500 shake"
                          : ""
                      }`}
                      disabled={isSolved}
                    />
                    <button
                      type="submit"
                      className="btn-hack-filled rounded-lg px-6 disabled:opacity-50"
                      disabled={!flagInput.trim() || isSolved || loading}
                    >
                      Submit
                    </button>
                  </div>
                  {submitStatus === "incorrect" && (
                    <p className="text-red-400 text-sm mt-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Incorrect flag. Try again!
                    </p>
                  )}
                  {(isSolved || submitStatus === "already_solved") && (
                    <p className="text-green-400 text-sm mt-3 flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      Your team has already solved this challenge!
                    </p>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div
          className={`flex justify-between transition-all duration-700 delay-300 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          {prevChallenge ? (
            <Link
              to={`/ctf/challenge/${prevChallenge.id}`}
              className="flex items-center gap-2 text-gray-400 hover:text-matrix transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <div className="text-left">
                <div className="text-xs font-terminal text-gray-500">
                  PREVIOUS
                </div>
                <div className="font-medium">{prevChallenge.title}</div>
              </div>
            </Link>
          ) : (
            <div />
          )}

          {nextChallenge ? (
            <Link
              to={`/ctf/challenge/${nextChallenge.id}`}
              className="flex items-center gap-2 text-gray-400 hover:text-matrix transition-colors"
            >
              <div className="text-right">
                <div className="text-xs font-terminal text-gray-500">NEXT</div>
                <div className="font-medium">{nextChallenge.title}</div>
              </div>
              <ChevronRight className="w-5 h-5" />
            </Link>
          ) : (
            <div />
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Challenge?"
        message={`Are you sure you want to delete "${challenge.title}"? This will hide the challenge from all users. Team submissions will be preserved.`}
        confirmText="DELETE"
        cancelText="CANCEL"
        loading={deleting}
        variant="danger"
      />
    </div>
  );
}

export default ChallengeDetail;
