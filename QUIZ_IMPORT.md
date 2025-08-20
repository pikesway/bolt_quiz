# Quiz Import Guide

## JSON Import Feature
The Quiz Builder now supports importing quizzes from JSON files, making it easy to create quizzes programmatically or through AI generation.

### How to Import a Quiz
1. Click the "Import JSON" button in the Quiz Builder
2. Select your JSON file
3. The quiz will be automatically populated with the imported content

### JSON Structure
Your JSON file must follow this structure:

```json
{
  "title": "Quiz Title",
  "description": "Quiz Description",
  "slug": "quiz-url-slug",
  "personalityTypes": [
    {
      "name": "Type Name",
      "description": "Type Description",
      "color": "#HEX",
      "icon": "IconName"
    }
  ],
  "questions": [
    {
      "text": "Question Text",
      "orderIndex": 0,
      "answers": [
        {
          "text": "Answer Text",
          "personalityType": "Type Name",
          "weight": 1,
          "orderIndex": 0
        }
      ]
    }
  ]
}
```

### Required Fields
- `title`: String
- `description`: String
- `personalityTypes`: Array of personality type objects
  - Each type must have `name`, `description`, `color`, and `icon`
- `questions`: Array of question objects
  - Each question must have `text` and `answers`
  - Each answer must have `text`, `personalityType` (matching a type name), `weight`, and `orderIndex`

### Optional Fields
- `slug`: String (URL-friendly version of the title)
- Question `imageUrl`: String (URL to question image)
- Personality type `resultImageUrl`: String (URL to result image)

### Using with AI Generation
A template file (`quiz-template.json`) is provided to help AI agents generate compatible quiz content. The template includes placeholders and instructions for generating:
- Quiz title and description
- Personality types with descriptions
- Questions with answers mapped to personality types

To use with AI:
1. Provide the template to your AI agent
2. Request quiz generation for your specific topic
3. Import the generated JSON into the Quiz Builder

### Tips for AI Generation
- Ensure personality types are distinct and well-defined
- Create questions that effectively differentiate between types
- Maintain consistent answer patterns across questions
- Use natural, engaging language
- Keep descriptions concise but informative