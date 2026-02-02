import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function VisionFeedback({ visionData }) {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!visionData) return null;

    // Check if confidence is above threshold
    const confidence = visionData.confidence || visionData.combined_confidence || 0;
    const CONFIDENCE_THRESHOLD = 0.5; // 50%

    if (confidence < CONFIDENCE_THRESHOLD) return null;

    // Extract observations from vision data
    const getObservations = () => {
        const observations = [];

        // Handle single image analysis
        if (visionData.observations) {
            return visionData.observations;
        }

        // Handle multiple images
        if (visionData.analyses && visionData.analyses.length > 0) {
            visionData.analyses.forEach((analysis, idx) => {
                if (analysis.observations) {
                    observations.push(`Image ${idx + 1}:`);
                    observations.push(...analysis.observations.map(obs => `  • ${obs}`));
                }
            });
            return observations;
        }

        // Fallback: extract from description or analysis text
        if (visionData.description) {
            observations.push(visionData.description);
        }
        if (visionData.analysis) {
            observations.push(visionData.analysis);
        }

        return observations.length > 0 ? observations : ['Image analyzed'];
    };

    const observations = getObservations();

    return (
        <div className="vision-feedback-card">
            <button
                className="vision-feedback-header"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <span className="vision-feedback-title">
                    💡 What I noticed from your image
                </span>
                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            {isExpanded && (
                <div className="vision-feedback-content">
                    <ul className="vision-observations">
                        {observations.map((obs, idx) => (
                            <li key={idx}>{obs}</li>
                        ))}
                    </ul>
                    <div className="vision-confidence">
                        Confidence: {Math.round((confidence || 0) * 100)}%
                    </div>
                </div>
            )}
        </div>
    );
}
