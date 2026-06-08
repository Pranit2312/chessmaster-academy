import { useState, useEffect, useCallback, useRef } from 'react';
import { analysisAPI } from '../utils/api';

export function useAnalysisList() {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalyses = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await analysisAPI.getMyAnalyses();
      setAnalyses(data.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load analyses');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalyses();
  }, [fetchAnalyses]);

  return { analyses, loading, error, refetch: fetchAnalyses };
}

export function useAnalysisDetail(analysisId) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const pollRef = useRef(null);

  const fetchAnalysis = useCallback(async () => {
    if (!analysisId) return;
    try {
      const { data } = await analysisAPI.getAnalysisById(analysisId);
      setAnalysis(data.data);
      setError(null);
      return data.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load analysis');
      return null;
    } finally {
      setLoading(false);
    }
  }, [analysisId]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      const result = await fetchAnalysis();
      if (!mounted || !result) return;

      if (result.status === 'queued' || result.status === 'analyzing') {
        pollRef.current = setInterval(async () => {
          const { data } = await analysisAPI.getAnalysisStatus(analysisId);
          const statusData = data.data;
          if (statusData.status === 'completed' || statusData.status === 'failed') {
            clearInterval(pollRef.current);
            await fetchAnalysis();
          }
        }, 2000);
      }
    };

    load();

    return () => {
      mounted = false;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [analysisId, fetchAnalysis]);

  return { analysis, loading, error, refetch: fetchAnalysis };
}

export function useSubmitAnalysis() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (pgn, depth) => {
    try {
      setSubmitting(true);
      setError(null);
      const { data } = await analysisAPI.submitAnalysis({ pgn, depth });
      return data.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to submit game';
      setError(message);
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  return { submit, submitting, error };
}
