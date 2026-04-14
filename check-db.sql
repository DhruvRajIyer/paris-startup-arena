-- Check jobs by source
SELECT source, COUNT(*) as count, MAX(created_at) as latest
FROM jobs
GROUP BY source
ORDER BY count DESC;
