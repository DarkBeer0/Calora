import React from 'react';
import { FlexWidget, TextWidget, IconWidget } from 'react-native-android-widget';

interface WidgetData {
  eaten: number;
  target: number;
  remaining: number;
  protein: number;
  fat: number;
  carbs: number;
  streak: number;
}

export function CaloriesWidget({ data }: { data: WidgetData }) {
  const progress = data.target > 0 ? Math.min(data.eaten / data.target, 1) : 0;
  const isOver = data.remaining < 0;
  const progressWidth = Math.round(progress * 100);

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      {/* Title row */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          width: 'match_parent',
        }}
      >
        <TextWidget text="🔥" style={{ fontSize: 16 }} />
        <TextWidget
          text="Calora"
          style={{ fontSize: 16, fontWeight: '700', color: '#4CAF50' }}
        />
        {data.streak > 0 && (
          <TextWidget
            text={`${data.streak} 🔥`}
            style={{ fontSize: 12, color: '#FB8C00', fontWeight: '600' }}
          />
        )}
      </FlexWidget>

      {/* Calories row */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          width: 'match_parent',
        }}
      >
        <TextWidget
          text={isOver ? `+${Math.abs(data.remaining)}` : `${data.remaining}`}
          style={{
            fontSize: 28,
            fontWeight: '800',
            color: isOver ? '#D32F2F' : '#4CAF50',
          }}
        />
        <TextWidget
          text={isOver ? 'kcal over' : 'kcal left'}
          style={{ fontSize: 12, color: '#757575' }}
        />
      </FlexWidget>

      {/* Progress bar */}
      <FlexWidget
        style={{
          width: 'match_parent',
          height: 6,
          backgroundColor: '#E8F5E9',
          borderRadius: 3,
        }}
      >
        <FlexWidget
          style={{
            width: `${progressWidth}%` as any,
            height: 6,
            backgroundColor: isOver ? '#D32F2F' : '#4CAF50',
            borderRadius: 3,
          }}
        />
      </FlexWidget>

      {/* Macros row */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          width: 'match_parent',
          justifyContent: 'space-between',
        }}
      >
        <TextWidget
          text={`Б ${data.protein}г`}
          style={{ fontSize: 11, color: '#1976D2', fontWeight: '600' }}
        />
        <TextWidget
          text={`Ж ${data.fat}г`}
          style={{ fontSize: 11, color: '#FB8C00', fontWeight: '600' }}
        />
        <TextWidget
          text={`У ${data.carbs}г`}
          style={{ fontSize: 11, color: '#43A047', fontWeight: '600' }}
        />
        <TextWidget
          text={`${data.eaten} / ${data.target} kcal`}
          style={{ fontSize: 11, color: '#757575' }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}
