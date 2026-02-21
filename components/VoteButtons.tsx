"use client";

import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "react-toastify";
import { doc, updateDoc, increment, getDoc, setDoc } from "firebase/firestore";

type VoteType = "confirm" | "possible" | "fraud" | "inactive";

export default function VoteButtons({
  reportId,
  counts,
}: {
  reportId: string;
  counts: {
    confirmations: number;
    inactiveVotes: number;
    possibleFraudVotes: number;
    fraudVotes: number;
  };
}) {
  const { user } = useAuth();
  const dominant = getDominant(counts);

  function getDominant(counts: any) {
    if (counts.fraudVotes >= 3) return "fraud";
    if (counts.inactiveVotes >= 2) return "inactive";

    const max = Math.max(
      counts.confirmations,
      counts.possibleFraudVotes,
      counts.fraudVotes,
      counts.inactiveVotes,
    );

    if (max === counts.confirmations) return "confirm";
    if (max === counts.possibleFraudVotes) return "possible";
    if (max === counts.inactiveVotes) return "inactive";
    if (max === counts.fraudVotes) return "fraud";

    return null;
  }

  function VoteButton({
    label,
    icon,
    color,
    count,
    isDominant,
    onClick,
  }: {
    label: string;
    icon: string;
    color: "green" | "gray" | "yellow" | "red";
    count: number;
    isDominant: boolean;
    onClick: () => void;
  }) {
    const baseColors = {
      green: "bg-green-600 hover:bg-green-700",
      gray: "bg-gray-700 hover:bg-gray-800",
      yellow: "bg-yellow-500 hover:bg-yellow-600",
      red: "bg-red-600 hover:bg-red-700",
    };

    return (
      <button
        onClick={onClick}
        className={`
        flex justify-between items-center
        px-2 py-1 rounded transition-all
        text-white
        ${baseColors[color]}
        ${isDominant ? "ring-2 ring-white scale-[1.02]" : "opacity-70 hover:cursor-pointer hover:opacity-100"}
      `}
      >
        <span>
          {icon} {label}
        </span>
        <span className="font-semibold">{count ?? 0}</span>
      </button>
    );
  }

  const handleVote = async (type: VoteType) => {
    if (!user) {
      toast.warning("Inicia sesión para votar");
      return;
    }

    try {
      const reportRef = doc(db, "reports", reportId);
      const voteRef = doc(db, "reports", reportId, "votes", user.uid);

      const voteSnap = await getDoc(voteRef);

      let previousType: VoteType | null = null;

      if (voteSnap.exists()) {
        previousType = voteSnap.data().voteType;
      }

      // 🔒 Si ya votó lo mismo → no hacer nada
      if (previousType === type) {
        toast.info("Ya votaste esta opción");
        return;
      }

      // 🔥 Si tenía voto anterior → restar contador anterior
      if (previousType) {
        await updateDoc(reportRef, {
          [mapVoteToField(previousType)]: increment(-1),
        });
      }

      // 🔥 Guardar / actualizar voto del usuario
      await setDoc(voteRef, {
        userId: user.uid,
        voteType: type,
        updatedAt: new Date().toISOString(),
      });

      // 🔥 Incrementar nuevo contador
      await updateDoc(reportRef, {
        [mapVoteToField(type)]: increment(1),
      });

      toast.success("Voto registrado");
    } catch (error) {
      console.error(error);
      toast.error("Error al votar");
    }
  };

  return (
    <div className="flex flex-col gap-2 text-xs">
      <VoteButton
        label="Disponible"
        icon="✅"
        color="green"
        count={counts.confirmations}
        isDominant={dominant === "confirm"}
        onClick={() => handleVote("confirm")}
      />

      <VoteButton
        label="Ya no disponible"
        icon="🏷"
        color="gray"
        count={counts.inactiveVotes}
        isDominant={dominant === "inactive"}
        onClick={() => handleVote("inactive")}
      />

      <VoteButton
        label="Posible fraude"
        icon="⚠️"
        color="yellow"
        count={counts.possibleFraudVotes}
        isDominant={dominant === "possible"}
        onClick={() => handleVote("possible")}
      />

      <VoteButton
        label="Fraude confirmado"
        icon="🚫"
        color="red"
        count={counts.fraudVotes}
        isDominant={dominant === "fraud"}
        onClick={() => handleVote("fraud")}
      />
    </div>
  );
}

function mapVoteToField(type: VoteType) {
  switch (type) {
    case "confirm":
      return "confirmations";
    case "possible":
      return "possibleFraudVotes";
    case "fraud":
      return "fraudVotes";
    case "inactive":
      return "inactiveVotes";
  }
}
