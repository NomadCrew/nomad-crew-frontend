import React, { useEffect } from 'react';
import eventBus from '@/src/events/eventBus';
import { TodoEvent, isValidTodoEvent } from '@/src/types/todo';

const useTodoEvents = () => {
  useEffect(() => {
    const handleTodoEvent = (data: TodoEvent) => {
      if (isValidTodoEvent(data)) {
        console.log('Received todo event:', data);
        // Update your store or state here accordingly.
      }
    };

    eventBus.on('TODO_CREATED', handleTodoEvent);
    eventBus.on('TODO_UPDATED', handleTodoEvent);
    eventBus.on('TODO_DELETED', handleTodoEvent);

    return () => {
      eventBus.off('TODO_CREATED', handleTodoEvent);
      eventBus.off('TODO_UPDATED', handleTodoEvent);
      eventBus.off('TODO_DELETED', handleTodoEvent);
    };
  }, []);
};

export default useTodoEvents;
