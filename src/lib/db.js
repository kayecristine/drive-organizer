// Mock project and task services

export const projectService = {
  getProjects: async () => {
    return [
      { id: 'proj_1', name: 'Website Redesign' },
      { id: 'proj_2', name: 'Marketing Campaign' }
    ];
  }
};

export const taskService = {
  getTasks: async () => {
    return [
      { id: 'task_1', title: 'Design Mockups' },
      { id: 'task_2', title: 'Write Copy' }
    ];
  }
};
