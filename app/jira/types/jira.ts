interface JiraUser {
  account_id: string;
  name: string;
  email: string;
  picture: string;
}

interface JiraSite {
  id: string;
  name: string;
  url: string;
}

interface JiraProject {
  id: string;
  key: string;
  name: string;
  description?: string;
  lead?: {
    displayName: string;
    accountId: string;
  };
  projectTypeKey: string;
}

interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    description?: any;
    status: {
      name: string;
      statusCategory: {
        colorName: string;
      };
    };
    issuetype: {
      name: string;
      iconUrl: string;
    };
    assignee?: {
      displayName: string;
      accountId: string;
    };
    reporter: {
      displayName: string;
      accountId: string;
    };
    created: string;
    updated: string;
    priority?: {
      name: string;
    };
  };
}

interface CreateIssueData {
  projectKey: string;
  summary: string;
  description: string;
  issueType: string;
  priority?: string;
}