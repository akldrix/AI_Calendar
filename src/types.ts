  enum Category {
    Home = "home",
    Work = "work",
    Self = "self",
  }

  export interface Task {
    id: string;
    title: string;
    description?: string;
    start_time: string;
    end_time: string;
    category: Category;
    date: string;
  }
