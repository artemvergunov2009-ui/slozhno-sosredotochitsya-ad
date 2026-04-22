import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../App';

export default function DeadlineObserver() {
  const { user, profile } = useAuth();

  useEffect(() => {
    if (!user || profile?.role !== 'student') return;

    async function checkDeadlines() {
      if (!profile?.class_name) return;
      const studentGrade = parseInt(profile.class_name);

      // 1. Get only lessons for this student's grade
      const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('target_grade', studentGrade);

      if (lessonsError || !lessons) return;

      // 2. Get user's submissions
      const { data: submissions, error: submissionsError } = await supabase
        .from('submissions')
        .select('lesson_id')
        .eq('student_id', user.id);

      if (submissionsError) return;

      const submittedLessonIds = new Set(submissions?.map(s => s.lesson_id));
      const now = new Date();

      for (const lesson of lessons) {
        const deadline = new Date(lesson.deadline);
        if (now > deadline && !submittedLessonIds.has(lesson.id)) {
          // Automatic rejection
          try {
            await supabase
              .from('submissions')
              .upsert({
                lesson_id: lesson.id,
                student_id: user.id,
                status: 'rejected',
                grade: '2',
                grade_comment: 'Домашнее задание отсутствует',
                grade_coefficient: 1,
                file_urls: [],
                created_at: new Date().toISOString()
              }, { onConflict: 'lesson_id,student_id' });
            console.log(`Auto-failed lesson ${lesson.id}`);
          } catch (e) {
             // Maybe already created
          }
        }
      }
    }

    checkDeadlines();
  }, [user, profile]);

  return null;
}
