import React, { useState } from 'react';
import { Award, GraduationCap, BookOpen } from 'lucide-react';
import { CVAuditView } from './CVAuditView';
import { InterviewPrepView } from './InterviewPrepView';
import { ResourcesView } from './ResourcesView';

export const PrepAndCvView: React.FC = () => {
  const [subTab, setSubTab] = useState<'cv' | 'interview' | 'resources'>('cv');

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-b border-[#e5e5e5] pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSubTab('cv')}
            className={`sq-btn ${subTab === 'cv' ? 'sq-btn-primary' : ''}`}
          >
            <Award className="w-3.5 h-3.5" />
            AUDIT CV & LETTRE
          </button>
          <button
            onClick={() => setSubTab('interview')}
            className={`sq-btn ${subTab === 'interview' ? 'sq-btn-primary' : ''}`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            GUIDE ENTRETIEN DESK
          </button>
          <button
            onClick={() => setSubTab('resources')}
            className={`sq-btn ${subTab === 'resources' ? 'sq-btn-primary' : ''}`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            ATTENTES FIRMES & RESSOURCES
          </button>
        </div>
      </div>

      <div className="bw-mono-override">
        {subTab === 'cv' && <CVAuditView />}
        {subTab === 'interview' && <InterviewPrepView />}
        {subTab === 'resources' && <ResourcesView />}
      </div>
    </div>
  );
};
