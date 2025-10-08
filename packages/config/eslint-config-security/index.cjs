module.exports = {
  rules: {
    // Custom rule: flag direct user input passed to OpenAI API without validation
    'no-raw-prompt-to-openai': {
      create(context) {
        return {
          CallExpression(node) {
            if (
              node.callee.type === 'MemberExpression' &&
              node.callee.property.name === 'generateChatCompletion'
            ) {
              const arg = node.arguments[0];
              if (arg && arg.type === 'Identifier' && arg.name === 'prompt') {
                context.report({
                  node,
                  message:
                    'Prompt injection risk: user input passed directly to OpenAI API. Validate or sanitize input.',
                });
              }
            }
          },
        };
      },
    },
  },
};
