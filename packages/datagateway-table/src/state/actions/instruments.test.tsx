import {
  fetchInstruments,
  fetchInstrumentsRequest,
  fetchInstrumentsSuccess,
  fetchInstrumentsFailure,
} from '.';
import { StateType } from '../app.types';
import { initialState } from '../reducers/dgtable.reducer';
import axios from 'axios';
import { actions, dispatch, getState, resetActions } from '../../setupTests';
import * as log from 'loglevel';
import { Instrument } from 'datagateway-common';

jest.mock('loglevel');

describe('Instrument actions', () => {
  afterEach(() => {
    (axios.get as jest.Mock).mockClear();
    resetActions();
  });

  it('dispatches fetchInstrumentsRequest and fetchInstrumentsSuccess actions upon successful fetchInstruments action', async () => {
    const mockData: Instrument[] = [
      {
        ID: 1,
        NAME: 'Test 1',
      },
      {
        ID: 2,
        NAME: 'Test 2',
      },
    ];

    (axios.get as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        data: mockData,
      })
    );

    const asyncAction = fetchInstruments();
    await asyncAction(dispatch, getState, null);

    expect(actions[0]).toEqual(fetchInstrumentsRequest());
    expect(actions[1]).toEqual(fetchInstrumentsSuccess(mockData));
  });

  it('fetchInstruments action applies filters and sort state to request params', async () => {
    (axios.get as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        data: [],
      })
    );

    const asyncAction = fetchInstruments();
    const getState = (): Partial<StateType> => ({
      dgtable: {
        ...initialState,
        sort: { column1: 'desc' },
        filters: { column1: '1', column2: '2' },
      },
    });
    await asyncAction(dispatch, getState, null);

    expect(actions[0]).toEqual(fetchInstrumentsRequest());

    expect(actions[1]).toEqual(fetchInstrumentsSuccess([]));

    expect(axios.get).toHaveBeenCalledWith(
      '/instruments',
      expect.objectContaining({
        params: {
          filter: {
            order: 'column1 desc',
            where: { column1: '1', column2: '2' },
          },
        },
      })
    );
  });

  it('dispatches fetchInstrumentsRequest and fetchInstrumentsFailure actions upon unsuccessful fetchInstruments action', async () => {
    (axios.get as jest.Mock).mockImplementationOnce(() =>
      Promise.reject({
        message: 'Test error message',
      })
    );

    const asyncAction = fetchInstruments();
    await asyncAction(dispatch, getState, null);

    expect(actions[0]).toEqual(fetchInstrumentsRequest());
    expect(actions[1]).toEqual(fetchInstrumentsFailure('Test error message'));

    expect(log.error).toHaveBeenCalled();
    const mockLog = (log.error as jest.Mock).mock;
    expect(mockLog.calls[0][0]).toEqual('Test error message');
  });
});