import { forwardRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import type { AssessmentResult } from '../../types';

interface HiddenChartsProps {
    results: AssessmentResult;
}

// We render this off-screen to capture it with html2canvas
export const HiddenCharts = forwardRef<HTMLDivElement, HiddenChartsProps>(({ results }, ref) => {
    const domainData = results.domains ? Object.entries(results.domains).map(([key, value]) => ({
        name: key,
        score: value.percentile,
    })) : [];

    const radarData = results.domains ? Object.entries(results.domains).map(([key, value]) => ({
        subject: key,
        A: value.percentile,
        fullMark: 100,
    })) : [];

    return (
        <div ref={ref} style={{ position: 'absolute', left: '-9999px', top: 0, width: '600px', background: 'white', padding: '20px' }}>
            <div style={{ marginBottom: '20px' }}>
                <h3>Domain Scores</h3>
                <BarChart width={500} height={300} data={domainData} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="name" type="category" />
                    <Bar dataKey="score" fill="#4361ee" />
                </BarChart>
            </div>
            <div>
                <h3>Profile Shape</h3>
                <RadarChart cx={250} cy={200} outerRadius={120} width={500} height={400} data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar name="Percentile" dataKey="A" stroke="#f72585" fill="#f72585" fillOpacity={0.6} />
                </RadarChart>
            </div>
        </div>
    );
});

HiddenCharts.displayName = 'HiddenCharts';
