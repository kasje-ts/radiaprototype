import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { Assessment } from './components/Assessment';
import { DevelopmentPlan } from './components/DevelopmentPlan';
import { MonthlyPlanRedirect } from './components/MonthlyPlanRedirect';
import { Reflection } from './components/Reflection';
import { YearCalendar } from './components/YearCalendar';
import { MonthDetail } from './components/MonthDetail';
import { RolesAndTasks } from './components/RolesAndTasks';
import { MyActions } from './components/MyActions';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: MyActions },
      { path: 'assessment', Component: Assessment },
      { path: 'development-plan', Component: DevelopmentPlan },
      { path: 'monthly-plan', Component: MonthlyPlanRedirect },
      { path: 'reflection/:month/:year', Component: Reflection },
      { path: 'reflection', Component: Reflection },
      { path: 'year-calendar', Component: YearCalendar },
      { path: 'month/:month/:year', Component: MonthDetail },
      { path: 'roles', Component: RolesAndTasks },
      {
        path: 'prototype',
        lazy: () =>
          import('./components/PrototypeSettings').then(m => ({
            Component: m.PrototypeSettings,
          })),
      },
    ],
  },
]);