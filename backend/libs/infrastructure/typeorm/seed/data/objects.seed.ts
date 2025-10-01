import { ObjectStatus, WorkStatus } from '../../../../../src/objects/entities/city-object.entity';

export const objectsSeedData = [
  {
    name: 'Парк "Зарядье"',
    address: 'ул. Варварка, 6с1',
    description: 'Реконструкция детских площадок и обновление системы освещения парка',
    polygon: {
      type: 'Polygon',
      coordinates: [
        [55.751369, 37.628694], // Зарядье
        [55.751471, 37.629960],
        [55.750631, 37.630067],
        [55.750567, 37.628865]
      ]
    },
    work_schedule: {
      startDate: '2025-10-01',
      endDate: '2025-12-01',
      workTypes: [
        {
          id: '1',
          name: 'Демонтаж старого оборудования',
          description: 'Демонтаж устаревших игровых конструкций и осветительных приборов',
          startDate: '2025-10-01',
          endDate: '2025-10-15',
          unit: 'шт',
          amount: 15,
          status: WorkStatus.NOT_STARTED
        },
        {
          id: '2',
          name: 'Установка нового оборудования',
          description: 'Монтаж современного игрового комплекса и LED освещения',
          startDate: '2025-10-16',
          endDate: '2025-11-01',
          unit: 'комплект',
          amount: 1,
          status: WorkStatus.NOT_STARTED
        }
      ]
    },
    documents: [],
    status: 'planned',
    created_by_id: '55a868fa-0007-4413-aa6e-193ecdc80ca8'
  },
  {
    name: 'Парк Горького',
    address: 'ул. Крымский Вал, 9',
    description: 'Благоустройство центральной аллеи и реконструкция фонтана',
    polygon: {
      type: 'Polygon',
      coordinates: [
        [55.731640, 37.601123],
        [55.731672, 37.601896],
        [55.731147, 37.601944],
        [55.731115, 37.601209]
      ]
    },
    work_schedule: {
      startDate: '2025-10-15',
      endDate: '2025-12-15',
      workTypes: [
        {
          id: '3',
          name: 'Реконструкция фонтана',
          description: 'Обновление гидравлической системы и облицовки фонтана',
          startDate: '2025-10-15',
          endDate: '2025-11-15',
          unit: 'услуга',
          amount: 1,
          status: WorkStatus.IN_PROGRESS
        },
        {
          id: '4',
          name: 'Благоустройство аллеи',
          description: 'Укладка нового покрытия и установка малых архитектурных форм',
          startDate: '2025-11-16',
          endDate: '2025-12-01',
          unit: 'м²',
          amount: 1200,
          status: WorkStatus.NOT_STARTED
        }
      ]
    },
    documents: [],
    status: 'planned',
    created_by_id: '55a868fa-0007-4413-aa6e-193ecdc80ca8'
  }
];
