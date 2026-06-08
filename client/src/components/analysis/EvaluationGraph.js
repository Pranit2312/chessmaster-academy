import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { formatEval } from '../../utils/pgnHelpers';

const EvaluationGraph = ({ moves = [] }) => {
  const data = moves.map((move, index) => ({
    move: index + 1,
    eval: (move.evaluationAfter || 0) / 100,
    label: move.san
  }));

  if (!data.length) return null;

  return (
    <div className="evaluation-graph">
      <h4>Evaluation Over Time</h4>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <XAxis dataKey="move" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
          <ReferenceLine y={0} stroke="#999" strokeDasharray="3 3" />
          <Tooltip
            formatter={(value) => [formatEval(value * 100), 'Eval']}
            labelFormatter={(label) => `Move ${label}`}
          />
          <Line
            type="monotone"
            dataKey="eval"
            stroke="var(--primary-color, #4f46e5)"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EvaluationGraph;
