export default {
  rules: {
    // Custom rule: Prevent direct user input to OpenAI API without validation
    'no-raw-prompt-to-openai': {
      create(context) {
        return {
          CallExpression(node) {
            if (
              node.callee.type === 'MemberExpression' &&
              node.callee.object.name === 'OpenaiService' &&
              node.callee.property.name === 'generateChatCompletion'
            ) {
              const promptArg = node.arguments[0];
              if (promptArg && promptArg.type === 'Identifier' && promptArg.name === 'prompt') {
                context.report({
                  node,
                  message:
                    'Prompt Injection Risk: Validate or sanitize user input before passing to OpenAI API.',
                });
              }
            }
          },
        };
      },
    },
  },
};
