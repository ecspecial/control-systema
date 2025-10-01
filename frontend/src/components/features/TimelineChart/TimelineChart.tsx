import React, { useEffect, useRef } from 'react';
import { Timeline } from 'vis-timeline/standalone';
import { DataSet } from 'vis-data';
import type { TimelineOptions, TimelineTimeAxisScaleType } from 'vis-timeline/standalone';
import 'vis-timeline/styles/vis-timeline-graph2d.min.css';

type WorkType = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
};

interface TimelineChartProps {
  workTypes: WorkType[];
}

const TimelineChart: React.FC<TimelineChartProps> = ({ workTypes }) => {
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const timeline = useRef<Timeline | null>(null);

  useEffect(() => {
    if (!timelineRef.current || !workTypes.length) return;

    const items = new DataSet(
      workTypes.map((work) => ({
        id: work.id,
        content: `${work.name}<br><small>${new Date(work.startDate).toLocaleDateString('ru')} - ${new Date(work.endDate).toLocaleDateString('ru')}</small>`,
        start: new Date(work.startDate),
        end: new Date(work.endDate),
        type: 'range',
        className: 'timeline-item'
      }))
    );

    // Find min and max dates
    const minDate = new Date(Math.min(...workTypes.map(w => new Date(w.startDate).getTime())));
    const maxDate = new Date(Math.max(...workTypes.map(w => new Date(w.endDate).getTime())));

    // Add some padding
    minDate.setDate(minDate.getDate() - 5);
    maxDate.setDate(maxDate.getDate() + 5);

    const options: TimelineOptions = {
      editable: false,
      margin: {
        item: 20,
        axis: 10,
      },
      orientation: 'top' as const,
      showCurrentTime: false,
      locale: 'ru',
      stack: true,
      timeAxis: { 
        scale: 'day' as TimelineTimeAxisScaleType, 
        step: 5  // Show every 5th day
      },
      format: {
        minorLabels: {
          day: 'D MMM',  // Format: "15 окт"
          month: 'MMMM'  // Format: "Октябрь"
        },
        majorLabels: {
          day: '',       // Hide major labels for days
          month: 'YYYY'  // Only show year for months
        }
      },
      width: '100%',
      verticalScroll: false,
      horizontalScroll: true,
      zoomable: true,
      moveable: true,
      height: '200px', // Fixed larger height
      min: minDate,
      max: maxDate,
      zoomMin: 1000 * 60 * 60 * 24 * 10,  // 10 days
      zoomMax: 1000 * 60 * 60 * 24 * 90   // 90 days
    };

    if (timeline.current) {
      timeline.current.destroy();
      timeline.current = null;
    }

    timeline.current = new Timeline(timelineRef.current, items, options);

  }, [workTypes]);

  return (
    <div style={{
      border: '1px solid #dee2e6',
      borderRadius: '8px',
      padding: '16px',
      backgroundColor: 'white',
      marginBottom: '20px',
      height: '250px', // Container height to accommodate the timeline
    }}>
      <div 
        ref={timelineRef} 
        style={{ 
          width: '100%',
          height: '200px', // Match timeline height
          backgroundColor: 'white',
        }} 
      />
    </div>
  );
};

export default TimelineChart;
