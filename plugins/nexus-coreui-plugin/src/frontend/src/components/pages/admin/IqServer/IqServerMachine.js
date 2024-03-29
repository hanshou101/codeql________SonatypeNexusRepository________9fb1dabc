/*
 * Sonatype Nexus (TM) Open Source Version
 * Copyright (c) 2008-present Sonatype, Inc.
 * All rights reserved. Includes the third-party code listed at http://links.sonatype.com/products/nexus/oss/attributions.
 *
 * This program and the accompanying materials are made available under the terms of the Eclipse Public License Version 1.0,
 * which accompanies this distribution and is available at http://www.eclipse.org/legal/epl-v10.html.
 *
 * Sonatype Nexus (TM) Open Source Version is distributed with Sencha Ext JS pursuant to a FLOSS Exception agreed upon
 * between Sonatype, Inc. and Sencha Inc. Sencha Ext JS is licensed under GPL v3 and cannot be redistributed as part of a
 * closed source work.
 *
 * Sonatype Nexus (TM) Professional Version is available from Sonatype, Inc. "Sonatype" and "Sonatype Nexus" are trademarks
 * of Sonatype, Inc. Apache Maven is a trademark of the Apache Software Foundation. M2eclipse is a trademark of the
 * Eclipse Foundation. All other trademarks are the property of their respective owners.
 */
import React, {useState, useEffect} from 'react';
import {assign} from 'xstate';
import Axios from 'axios';
import {ExtJS, FormUtils, ValidationUtils} from '@sonatype/nexus-ui-plugin';

import UIStrings from '../../../../constants/UIStrings';

const IQ_API = '/service/rest/v1/iq';

export default FormUtils.buildFormMachine({
  id: 'IQServerMachine',
  context: {
    data: {}
  },
  config: (config) => ({
    ...config,
    states: {
      ...config.states,
      loaded: {
        initial: 'idle',
        states: {
          idle: {
            on: {
              VERIFY_CONNECTION: {
                target: 'verifyingConnection',
                actions: ['clearVerifyConnectionError']
              }
            }
          },
          verifyingConnection: {
            invoke: {
              src: 'verifyConnection',
              onDone: {
                target: 'success',
                actions: ['setVerifyConnectionSuccessMessage']
              },
              onError: {
                target: 'error',
                actions: ['setVerifyConnectionError']
              }
            }
          },
          success: {
            on: {
              DISMISS: {
                target: 'idle'
              }
            }
          },
          error: {
            on: {
              DISMISS: {
                target: 'idle'
              },
              VERIFY_CONNECTION: {
                target: 'verifyingConnection',
                actions: ['clearVerifyConnectionError']
              }
            }
          }
        },
        ...config.states.loaded,
      }
    }
  })
}).withConfig({
  actions: {
    validate: assign({
      validationErrors: ({data}) => ({
        url: ValidationUtils.validateIsUrl(data.url),
        authenticationType: ValidationUtils.validateNotBlank(data.authenticationType),
        username: data.authenticationType === 'USER' ? ValidationUtils.validateNotBlank(data.username) : null,
        password: data.authenticationType === 'USER' ? ValidationUtils.validateNotBlank(data.password) : null,
        timeoutSeconds:  ValidationUtils.isInRange({
          value: data.timeoutSeconds,
          min: 1,
          max: 3600
        })
      })
    }),
    setVerifyConnectionError: assign({
      verifyConnectionError: (_, event) => {
        return event.data?.response?.data;
      }
    }),
    setVerifyConnectionSuccessMessage: assign({
      verifyConnectionSuccessMessage: (_, event) => {
        return event.data?.data?.reason;
      }
    }),
    clearVerifyConnectionError: assign({
      verifyConnectionError: () => null
    })
  },
  services: {
    fetchData: () => Axios.get(IQ_API),
    saveData: ({data}) => Axios.put(IQ_API, data),
    verifyConnection: ({data}) => Axios.post('/service/rest/internal/ui/iq/verify-connection', data)
  }
});
