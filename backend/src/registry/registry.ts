// registry.ts
import { readEmails, sendEmail } from '../utils/gmail';

const registry: Record<string, Record<string, (input: any) => Promise<any>>> = {
  gmail: {
    send: async (input) => {
      try {
        let messageBody = input?.message;
        if (messageBody == null || messageBody === '') {
          messageBody = extractText(input);
        }
        const result = await sendEmail({ 
          to: input?.to, 
          subject: input?.subject, 
          message: messageBody || '' 
        });
        return { 
          success: true, 
          messageId: result?.id,
          sentAt: new Date().toISOString(),
          to: input?.to,
          subject: input?.subject,
          usedBodyPreview: (messageBody || '').slice(0, 80)
        };
      } catch (error: any) {
        return { 
          success: false, 
          error: error.message 
        };
      }
    },
   read: async (input) => {
  try {
    const emails = await readEmails({ 
      from: input?.from,
      to: input?.to,           // Add this
      subject: input?.subject, // Add this
      hasAttachment: input?.hasAttachment, // Add this
      maxResults: input?.maxResults || 10 
    });
    return { 
      success: true, 
      emails,
      count: emails?.length || 0,
      filters: {
        from: input?.from,
        to: input?.to,
        subject: input?.subject,
        hasAttachment: input?.hasAttachment
      }
    };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message 
    };
  }
},
    schedule: async (input) => {
      // Schedule email for later - in production you'd use a job queue
      const scheduledTime = input?.scheduleTime ? new Date(input.scheduleTime) : new Date(Date.now() + 60000);
      return { 
        success: true, 
        scheduled: true,
        scheduledFor: scheduledTime.toISOString(),
        to: input?.to,
        subject: input?.subject,
        message: input?.message
      };
    },
    filter: async (input) => {
      try {
        const emails = await readEmails({ 
          from: input?.from, 
          query: input?.query, 
          maxResults: input?.maxResults || 50 
        });
        
        // Apply additional filtering if specified
        let filteredEmails = emails;
        if (input?.filters) {
          filteredEmails = emails.filter(email => {
            // Apply custom filters
            return true; // For now, return all emails
          });
        }
        
        return { 
          success: true, 
          emails: filteredEmails,
          count: filteredEmails?.length || 0,
          originalCount: emails?.length || 0
        };
      } catch (error: any) {
        return { 
          success: false, 
          error: error.message 
        };
      }
    },
    reply: async (input) => {
      try {
        let messageBody = input?.message;
        if (messageBody == null || messageBody === '') {
          messageBody = extractText(input);
        }
        const result = await sendEmail({ 
          to: input?.to, 
          subject: input?.subject || `Re: ${input?.originalSubject || 'Email'}`,
          message: messageBody || '',
          inReplyTo: input?.inReplyTo
        });
        return { 
          success: true, 
          messageId: result?.id,
          repliedTo: input?.inReplyTo,
          sentAt: new Date().toISOString(),
          usedBodyPreview: (messageBody || '').slice(0, 80)
        };
      } catch (error: any) {
        return { 
          success: false, 
          error: error.message 
        };
      }
    },
    default: async (input) => {
      return { 
        success: false, 
        error: 'No action specified for Gmail node' 
      };
    }
  },
  
  schedule: {
    delay: async (input) => {
      const delay = input?.delay || 5;
      const unit = input?.delayUnit || 'minutes';
      const delayMs = delay * getDelayMultiplier(unit);
      
      // In production, you'd use a proper job queue
      console.log(`Scheduling delay of ${delay} ${unit}`);
      
      return { 
        success: true, 
        delayed: true,
        delayMs,
        delay,
        unit,
        scheduledFor: new Date(Date.now() + delayMs).toISOString()
      };
    },
    specific: async (input) => {
      const scheduledTime = input?.datetime ? new Date(input.datetime) : new Date();
      
      if (scheduledTime <= new Date()) {
        return { 
          success: false, 
          error: 'Scheduled time must be in the future' 
        };
      }
      
      return { 
        success: true, 
        scheduled: true,
        scheduledFor: scheduledTime.toISOString(),
        originalTime: input?.datetime
      };
    },
    recurring: async (input) => {
      const interval = input?.interval || 1;
      const unit = input?.unit || 'hours';
      
      return { 
        success: true, 
        recurring: true,
        interval,
        unit,
        nextRun: new Date(Date.now() + getDelayMultiplier(unit) * interval).toISOString()
      };
    },
    cron: async (input) => {
      const cronExpression = input?.cron || '0 9 * * *';
      
      // In production, you'd use a cron parser and scheduler
      console.log(`Scheduling with cron: ${cronExpression}`);
      
      return { 
        success: true, 
        cron: true,
        expression: cronExpression,
        nextRun: 'Calculated from cron expression'
      };
    },
    default: async (input) => {
      return { 
        success: false, 
        error: 'No schedule type specified' 
      };
    }
  },
  
  condition: {
    evaluate: async (input) => {
      const { conditions, operator = 'AND' } = input;
      
      // Support both single condition (backward compatibility) and multiple conditions
      let conditionList = conditions || [input];
      
      if (!Array.isArray(conditionList)) {
        conditionList = [conditionList];
      }
      
      if (conditionList.length === 0) {
        return { 
          success: false, 
          error: 'No conditions specified' 
        };
      }
      
      const inputData = input?.input || {};
      const results = conditionList.map((condition: any) => {
        const { field, operator: op, value } = condition;
        
        if (!field) {
          return { 
            success: false, 
            error: 'No field specified for condition',
            condition
          };
        }
        
        const fieldValue = getNestedValue(inputData, field);
        const result = evaluateCondition({ field, operator: op, value }, inputData);
        
        return {
          success: true,
          result,
          field,
          operator: op,
          value,
          fieldValue,
          condition
        };
      });
      
      // Combine results based on operator (AND/OR)
      let finalResult = false;
      if (operator.toUpperCase() === 'AND') {
        finalResult = results.every((r: any) => r.success && r.result);
      } else if (operator.toUpperCase() === 'OR') {
        finalResult = results.some((r: any) => r.success && r.result);
      } else {
        // Default to AND
        finalResult = results.every((r: any) => r.success && r.result);
      }

      // If upstream is Gmail read result (emails array), filter emails using the condition(s)
      let filteredEmails: any[] | undefined;
      if (Array.isArray((inputData as any).emails)) {
        filteredEmails = (inputData as any).emails.filter((email: any) => {
          // Evaluate all conditions against this email object
          const perEmailResults = conditionList.map((c: any) => {
            const fieldValue = getNestedValue(email, c.field);
            return evaluateCondition({ field: c.field, operator: c.operator, value: c.value }, email);
          });
          if (operator.toUpperCase() === 'AND') {
            return perEmailResults.every(Boolean);
          } else {
            return perEmailResults.some(Boolean);
          }
        });
        const hasFiltered = Array.isArray(filteredEmails) && filteredEmails.length > 0;
        finalResult = hasFiltered;
      }

      return { 
        success: true, 
        result: finalResult,
        conditions: conditionList,
        operator,
        individualResults: results,
        filteredEmails,
        evaluatedAt: new Date().toISOString()
      };
    },
    default: async (input) => {
      return { 
        success: false, 
        error: 'No condition specified' 
      };
    }
  },
  
  llm: {
    summarize: async (input) => {
      try {
        const inputText = extractText(input) ?? (typeof input?.input === 'string' ? input.input : '');
        const response = await fetch('VITE_API_URL/api/llm/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'summarize',
            input: inputText,
            model: input?.model || 'gpt-3.5-turbo',
            service: input?.service || 'openai'
          })
        });
        
        if (!response.ok) {
          throw new Error(`LLM API error: ${response.status}`);
        }
        
        const result = await response.json();
        return { 
          success: true, 
          action: 'summarize',
          result: result.result,
          service: result.service,
          model: result.model,
          processingTime: result.processing_time_ms
        };
      } catch (error: any) {
        return { 
          success: false, 
          error: error.message 
        };
      }
    },
    reply: async (input) => {
      try {
        const inputText = extractText(input) ?? (typeof input?.input === 'string' ? input.input : '');
        const response = await fetch('VITE_API_URL/api/llm/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'reply',
            input: inputText,
            model: input?.model || 'gpt-3.5-turbo',
            service: input?.service || 'openai',
            customPrompt: input?.customPrompt
          })
        });
        
        if (!response.ok) {
          throw new Error(`LLM API error: ${response.status}`);
        }
        
        const result = await response.json();
        return { 
          success: true, 
          action: 'reply',
          result: result.result,
          service: result.service,
          model: result.model,
          processingTime: result.processing_time_ms
        };
      } catch (error: any) {
        return { 
          success: false, 
          error: error.message 
        };
      }
    },
    extract: async (input) => {
      try {
        const inputText = extractText(input) ?? (typeof input?.input === 'string' ? input.input : '');
        const response = await fetch('VITE_API_URL/api/llm/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'extract',
            input: inputText,
            model: input?.model || 'gpt-3.5-turbo',
            service: input?.service || 'openai'
          })
        });
        
        if (!response.ok) {
          throw new Error(`LLM API error: ${response.status}`);
        }
        
        const result = await response.json();
        return { 
          success: true, 
          action: 'extract',
          result: result.result,
          service: result.service,
          model: result.model,
          processingTime: result.processing_time_ms
        };
      } catch (error: any) {
        return { 
          success: false, 
          error: error.message 
        };
      }
    },
    translate: async (input) => {
      try {
        const response = await fetch('VITE_API_URL/api/llm/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'translate',
            input: input?.input || '',
            targetLanguage: input?.targetLanguage || 'English',
            model: input?.model || 'gpt-3.5-turbo',
            service: input?.service || 'openai'
          })
        });
        
        if (!response.ok) {
          throw new Error(`LLM API error: ${response.status}`);
        }
        
        const result = await response.json();
        return { 
          success: true, 
          action: 'translate',
          result: result.result,
          service: result.service,
          model: result.model,
          processingTime: result.processing_time_ms
        };
      } catch (error: any) {
        return { 
          success: false, 
          error: error.message 
        };
      }
    },
    default: async (input) => {
      // Try to use the action from config
      const action = input?.action || 'summarize';
      const handler = registry.llm[action];
      
      if (handler) {
        return await handler(input);
      }
      
      return { 
        success: false, 
        error: `Unsupported LLM action: ${action}` 
      };
    }
  },
  
  webhook: {
    GET: async (input) => {
      try {
        // Support dynamic URL construction from input data
        let url = input?.url;
        if (input?.input && typeof input.input === 'object') {
          // Replace placeholders in URL with actual values from input
          url = replacePlaceholders(url, input.input);
        }
        
        if (!url) {
          throw new Error('URL is required for webhook request');
        }

        const headers = parseHeaders(input?.headers);
        // Auto-set JSON content type if body looks like JSON and header missing
        
        const response = await fetch(url, {
          method: 'GET',
          headers,
        });
        
        const contentType = response.headers.get('content-type');
        let data;
        
        // Parse response based on content type
        if (contentType?.includes('application/json')) {
          data = await response.json();
        } else {
          data = await response.text();
        }
        
        return { 
          success: true, 
          status: response.status,
          statusText: response.statusText,
          data,
          headers: Object.fromEntries(response.headers.entries()),
          url,
          method: 'GET',
          contentType
        };
      } catch (error: any) {
        return { 
          success: false, 
          error: error.message,
          url: input?.url,
          method: 'GET'
        };
      }
    },
    POST: async (input) => {
      try {
        let url = input?.url;
        if (input?.input && typeof input.input === 'object') {
          url = replacePlaceholders(url, input.input);
        }
        
        if (!url) {
          throw new Error('URL is required for webhook request');
        }

        const headers = parseHeaders(input?.headers);
        let body = input?.body || '{}';
        
        // Support dynamic body construction from input data
        if (input?.input && typeof input.input === 'object') {
          body = replacePlaceholders(body, input.input);
        }
        
        if (body && typeof body === 'string') {
          try {
            JSON.parse(body);
            if (!headers['Content-Type']) headers['Content-Type'] = 'application/json';
          } catch {}
        }

        const response = await fetch(url, {
          method: 'POST',
          headers,
          body,
        });
        
        const contentType = response.headers.get('content-type');
        let data;
        
        if (contentType?.includes('application/json')) {
          data = await response.json();
        } else {
          data = await response.text();
        }
        
        return { 
          success: true, 
          status: response.status,
          statusText: response.statusText,
          data,
          headers: Object.fromEntries(response.headers.entries()),
          url,
          body,
          method: 'POST',
          contentType
        };
      } catch (error: any) {
        return { 
          success: false, 
          error: error.message,
          url: input?.url,
          method: 'POST'
        };
      }
    },
    PUT: async (input) => {
      try {
        let url = input?.url;
        if (input?.input && typeof input.input === 'object') {
          url = replacePlaceholders(url, input.input);
        }
        
        if (!url) {
          throw new Error('URL is required for webhook request');
        }

        const headers = parseHeaders(input?.headers);
        let body = input?.body || '{}';
        
        if (input?.input && typeof input.input === 'object') {
          body = replacePlaceholders(body, input.input);
        }
        
        const response = await fetch(url, {
          method: 'PUT',
          headers,
          body,
        });
        
        const contentType = response.headers.get('content-type');
        let data;
        
        if (contentType?.includes('application/json')) {
          data = await response.json();
        } else {
          data = await response.text();
        }
        
        return { 
          success: true, 
          status: response.status,
          statusText: response.statusText,
          data,
          headers: Object.fromEntries(response.headers.entries()),
          url,
          body,
          method: 'PUT',
          contentType
        };
      } catch (error: any) {
        return { 
          success: false, 
          error: error.message,
          url: input?.url,
          method: 'PUT'
        };
      }
    },
    PATCH: async (input) => {
      try {
        let url = input?.url;
        if (input?.input && typeof input.input === 'object') {
          url = replacePlaceholders(url, input.input);
        }
        
        if (!url) {
          throw new Error('URL is required for webhook request');
        }

        const headers = parseHeaders(input?.headers);
        let body = input?.body || '{}';
        
        if (input?.input && typeof input.input === 'object') {
          body = replacePlaceholders(body, input.input);
        }
        
        const response = await fetch(url, {
          method: 'PATCH',
          headers,
          body,
        });
        
        const contentType = response.headers.get('content-type');
        let data;
        
        if (contentType?.includes('application/json')) {
          data = await response.json();
        } else {
          data = await response.text();
        }
        
        return { 
          success: true, 
          status: response.status,
          statusText: response.statusText,
          data,
          headers: Object.fromEntries(response.headers.entries()),
          url,
          body,
          method: 'PATCH',
          contentType
        };
      } catch (error: any) {
        return { 
          success: false, 
          error: error.message,
          url: input?.url,
          method: 'PATCH'
        };
      }
    },
    DELETE: async (input) => {
      try {
        let url = input?.url;
        if (input?.input && typeof input.input === 'object') {
          url = replacePlaceholders(url, input.input);
        }
        
        if (!url) {
          throw new Error('URL is required for webhook request');
        }

        const headers = parseHeaders(input?.headers);
        
        const response = await fetch(url, {
          method: 'DELETE',
          headers,
        });
        
        const contentType = response.headers.get('content-type');
        let data;
        
        if (contentType?.includes('application/json')) {
          data = await response.json();
        } else {
          data = await response.text();
        }
        
        return { 
          success: true, 
          status: response.status,
          statusText: response.statusText,
          data,
          headers: Object.fromEntries(response.headers.entries()),
          url,
          method: 'DELETE',
          contentType
        };
      } catch (error: any) {
        return { 
          success: false, 
          error: error.message,
          url: input?.url,
          method: 'DELETE'
        };
      }
    },
    default: async (input) => {
      // Try to use the method from config
      const method = input?.method || 'GET';
      const handler = registry.webhook[method];
      
      if (handler) {
        return await handler(input);
      }
      
      return { 
        success: false, 
        error: `Unsupported HTTP method: ${method}` 
      };
    }
  }
};

// Helper functions
function getDelayMultiplier(unit: string): number {
  switch (unit) {
    case 'seconds': return 1000;
    case 'minutes': return 60 * 1000;
    case 'hours': return 60 * 60 * 1000;
    case 'days': return 24 * 60 * 60 * 1000;
    default: return 60 * 1000; // Default to minutes
  }
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

function evaluateCondition(config: any, input: any): boolean {
  const { field, operator, value } = config;
  
  if (!field) return true;
  
  const fieldValue = getNestedValue(input, field);
  
  switch (operator) {
    case 'equals': return fieldValue === value;
    case 'not_equals': return fieldValue !== value;
    case 'contains': return String(fieldValue).includes(String(value));
    case 'not_contains': return !String(fieldValue).includes(String(value));
    case 'starts_with': return String(fieldValue).startsWith(String(value));
    case 'ends_with': return String(fieldValue).endsWith(String(value));
    case 'greater_than': return Number(fieldValue) > Number(value);
    case 'less_than': return Number(fieldValue) < Number(value);
    case 'is_empty': return !fieldValue || fieldValue === '';
    case 'is_not_empty': return fieldValue && fieldValue !== '';
    default: return true;
  }
}

function parseHeaders(headersString: string): Record<string, string> {
  try {
    if (!headersString) return {};
    return JSON.parse(headersString);
  } catch {
    return {};
  }
}

export function getNodeHandler(type: string, action: string) {
  return registry[type]?.[action] || registry[type]?.['default'];
}

// Extract human-readable text from upstream inputs (LLM outputs, condition pass-through, raw strings)
function extractText(input: any): string | undefined {
  if (!input) return undefined;
  // Raw string
  if (typeof input === 'string') return input;

  // If the upstream data is under input
  const candidate = input.input;
  if (typeof candidate === 'string') return candidate;
  if (candidate && typeof candidate.result === 'string') return candidate.result;
  if (candidate && typeof candidate.output === 'string') return candidate.output;
  if (candidate && candidate.output && typeof candidate.output.result === 'string') return candidate.output.result;

  // Common structures from Gmail read and Condition filter
  if (candidate && Array.isArray(candidate.emails) && candidate.emails.length > 0) {
    const first = candidate.emails[0];
    // Use snippet + subject as a reasonable default text
    const parts = [first.subject, first.snippet].filter(Boolean);
    if (parts.length) return parts.join('\n');
  }
  if (Array.isArray(input.emails) && input.emails.length > 0) {
    const first = input.emails[0];
    const parts = [first.subject, first.snippet].filter(Boolean);
    if (parts.length) return parts.join('\n');
  }

  // Direct fields on the object
  if (typeof input.result === 'string') return input.result;
  if (typeof input.output === 'string') return input.output;
  if (input.output && typeof input.output.result === 'string') return input.output.result;

  return undefined;
}

function replacePlaceholders(template: string, data: any): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    const value = getNestedValue(data, key);
    return value !== undefined && value !== null ? String(value) : match;
  });
}
