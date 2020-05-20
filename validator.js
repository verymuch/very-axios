import { Validator } from 'jsonschema';

export default function configValidator(options) {
  const validator = new Validator();
  const schema = {
    title: 'very-axios options schema validator',
    type: 'object',
    properties: {
      tip: {
        description: 'whether or not show tips when error ocurrs',
        type: 'boolean',
      },
      tipFn: {
        description: 'whether or not show tips when error ocurrs',
        type: 'function',
      },
      lang: {
        description: 'error msg language: zh-cn/en',
        type: 'string',
        enum: ['zh-cn', 'en'],
      },
    },
  };

  const { errors } = validator.validate(options, schema);
  const hasError = errors.length > 0;
  if (hasError) {
    errors.forEach((err) => {
      console.error(`very-axios: ${err.property.split('instance.')[1]} ${err.message}`);
    });
  }
  return hasError;
}
