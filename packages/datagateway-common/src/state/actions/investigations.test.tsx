import {
  fetchInvestigations,
  fetchInvestigationsRequest,
  fetchInvestigationsSuccess,
  fetchInvestigationsFailure,
  fetchInvestigationDetailsRequest,
  fetchInvestigationDetailsSuccess,
  fetchInvestigationDetailsFailure,
  fetchInvestigationDetails,
  fetchISISInvestigations,
  fetchInvestigationCount,
  fetchInvestigationCountRequest,
  fetchInvestigationCountSuccess,
  fetchInvestigationCountFailure,
  fetchISISInvestigationCount,
  fetchInvestigationSizeRequest,
  fetchInvestigationSizeSuccess,
  fetchInvestigationSize,
  fetchInvestigationSizeFailure,
} from '.';
import { StateType, EntityCache } from '../app.types';
import { initialState } from '../reducers/dgcommon.reducer';
import axios from 'axios';
import { actions, dispatch, getState, resetActions } from '../../setupTests';
import * as log from 'loglevel';
import { Investigation } from 'datagateway-common';
import { fetchInvestigationDatasetsCountRequest } from './datasets';
import { DownloadDatasetSuccessType } from './actions.types';

jest.mock('loglevel');

describe('Investigation actions', () => {
  Date.now = jest.fn().mockImplementation(() => 1);

  const mockData: Investigation[] = [
    {
      ID: 1,
      TITLE: 'Test 1',
      NAME: 'Test 1',
      VISIT_ID: '1',
      RB_NUMBER: '1',
      DOI: 'doi 1',
      SIZE: 1,
      INVESTIGATIONINSTRUMENT: [
        {
          ID: 3,
          INVESTIGATION_ID: 1,
          INSTRUMENT_ID: 4,
          INSTRUMENT: {
            ID: 4,
            NAME: 'LARMOR',
          },
        },
      ],
      STARTDATE: '2019-06-10',
      ENDDATE: '2019-06-11',
    },
    {
      ID: 2,
      TITLE: 'Test 2',
      NAME: 'Test 2',
      VISIT_ID: '2',
      RB_NUMBER: '2',
      DOI: 'doi 2',
      SIZE: 10000,
      INVESTIGATIONINSTRUMENT: [
        {
          ID: 5,
          INVESTIGATION_ID: 2,
          INSTRUMENT_ID: 3,
          INSTRUMENT: {
            ID: 4,
            NAME: 'LARMOR',
          },
        },
      ],
      STARTDATE: '2019-06-10',
      ENDDATE: '2019-06-12',
    },
  ];

  // Mock axios GET requests to return mock data.
  (axios.get as jest.Mock).mockImplementation(() =>
    Promise.resolve({
      data: mockData,
    })
  );

  // Investigation cache for investigation ID 1 which has a size of 1.
  const mockInvestigationCache: EntityCache = {
    1: {
      childEntitySize: 1,
      childEntityCount: null,
    },
  };

  afterEach(() => {
    (axios.get as jest.Mock).mockClear();
    resetActions();
  });

  it('dispatches fetchInvestigationsRequest and fetchInvestigationsSuccess actions upon successful fetchInvestigations action', async () => {
    const asyncAction = fetchInvestigations();
    await asyncAction(dispatch, getState, null);

    expect(actions[0]).toEqual(fetchInvestigationsRequest(1));
    expect(actions[1]).toEqual(fetchInvestigationsSuccess(mockData, 1));
  });

  it('fetchInvestigations action applies filters and sort state to request params, as well as applying optional additional filters', async () => {
    const asyncAction = fetchInvestigations({
      additionalFilters: [
        {
          filterType: 'where',
          filterValue: JSON.stringify({ column3: { eq: 3 } }),
        },
      ],
    });
    const getState = (): Partial<StateType> => ({
      dgcommon: {
        ...initialState,
        sort: { column1: 'desc' },
        filters: { column1: '1', column2: '2' },
      },
    });
    await asyncAction(dispatch, getState, null);

    expect(actions[0]).toEqual(fetchInvestigationsRequest(1));

    expect(actions[1]).toEqual(fetchInvestigationsSuccess(mockData, 1));

    const params = new URLSearchParams();
    params.append('order', JSON.stringify('column1 desc'));
    params.append('where', JSON.stringify({ column1: { like: '1' } }));
    params.append('where', JSON.stringify({ column2: { like: '2' } }));
    params.append('where', JSON.stringify({ column3: { eq: 3 } }));

    expect(axios.get).toHaveBeenCalledWith(
      '/investigations',
      expect.objectContaining({
        params,
      })
    );
  });

  it('fetchInvestigations action sends fetchDatasetCount actions when specified via optional parameters', async () => {
    const asyncAction = fetchInvestigations({ getDatasetCount: true });
    await asyncAction(dispatch, getState, null);

    expect(actions[0]).toEqual(fetchInvestigationsRequest(1));
    expect(actions[1]).toEqual(fetchInvestigationsSuccess(mockData, 1));
    expect(actions[2]).toEqual(fetchInvestigationDatasetsCountRequest(1));
    expect(actions[3]).toEqual(fetchInvestigationDatasetsCountRequest(1));
  });

  it('dispatches fetchInvestigationsRequest and fetchInvestigationsFailure actions upon unsuccessful fetchInvestigations action', async () => {
    (axios.get as jest.Mock).mockImplementationOnce(() =>
      Promise.reject({
        message: 'Test error message',
      })
    );

    const asyncAction = fetchInvestigations();
    await asyncAction(dispatch, getState, null);

    expect(actions[0]).toEqual(fetchInvestigationsRequest(1));
    expect(actions[1]).toEqual(
      fetchInvestigationsFailure('Test error message')
    );

    expect(log.error).toHaveBeenCalled();
    const mockLog = (log.error as jest.Mock).mock;
    expect(mockLog.calls[0][0]).toEqual('Test error message');
  });

  it('dispatches fetchInvestigationsRequest and fetchInvestigationsSuccess actions upon successful fetchISISInvestigations action', async () => {
    const asyncAction = fetchISISInvestigations({
      instrumentId: 1,
      facilityCycleId: 2,
    });
    await asyncAction(dispatch, getState, null);

    expect(actions[0]).toEqual(fetchInvestigationsRequest(1));
    expect(actions[1]).toEqual(fetchInvestigationsSuccess(mockData, 1));
  });

  it('fetchISISInvestigation action sends fetchInvestigationSize actions when specified via optional parameters', async () => {
    const asyncAction = fetchISISInvestigations({
      instrumentId: 1,
      facilityCycleId: 2,
      optionalParams: { getSize: true },
    });
    await asyncAction(dispatch, getState, null);

    expect(actions).toHaveLength(6);
    expect(actions[0]).toEqual(fetchInvestigationsRequest(1));
    expect(actions[1]).toEqual(fetchInvestigationsSuccess(mockData, 1));
    expect(actions[2]).toEqual(fetchInvestigationSizeRequest());
  });

  it('dispatches fetchInvestigationSizeRequest and fetchInvestigationSizeSuccess actions upon successful fetchInvestigationSize action', async () => {
    (axios.get as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        data: 1,
      })
    );

    const asyncAction = fetchInvestigationSize(1);
    await asyncAction(dispatch, getState, null);

    expect(actions).toHaveLength(2);
    expect(actions[0]).toEqual(fetchInvestigationSizeRequest());
    expect(actions[1]).toEqual(fetchInvestigationSizeSuccess(1, 1));
    expect(axios.get).toHaveBeenCalledWith(
      '/user/getSize',
      expect.objectContaining({
        params: {
          sessionId: null,
          facilityName: 'LILS',
          entityType: 'investigation',
          entityId: 1,
        },
      })
    );
  });

  it('dispatches fetchInvestigationSizeRequest and fetchInvestigationSizeSuccess actions upon existing investigation cache and successful fetchInvestigationSize action', async () => {
    // Call fetch investigations with an ID of 1.
    const asyncAction = fetchInvestigationSize(1);

    // Set up state for calling fetchInvestigationSize with investigation cache.
    const getState = (): Partial<StateType> => ({
      dgcommon: {
        ...initialState,
        data: mockData,
        investigationCache: mockInvestigationCache,
      },
    });

    await asyncAction(dispatch, getState, null);

    // An axios request should not have been made since the size has been cached.
    expect(actions).toHaveLength(2);
    expect(actions[0]).toEqual(fetchInvestigationSizeRequest());
    expect(actions[1]).toEqual(fetchInvestigationSizeSuccess(1, 1));
    expect(axios.get).not.toHaveBeenCalled();
  });

  // TODO: Test fetchInvestigationSizeFailure error message
  it('dispatches fetchInvestigationSizeRequest and fetchInvestigationSizeFailure action upon unsuccessful fetchInvestigationsSize action', async () => {
    (axios.get as jest.Mock).mockImplementationOnce(() =>
      Promise.reject({
        message: 'Test error message',
      })
    );

    const asyncAction = fetchInvestigationSize(1);
    await asyncAction(dispatch, getState, null);

    expect(actions[0]).toEqual(fetchInvestigationSizeRequest());
    expect(actions[1]).toEqual(
      fetchInvestigationSizeFailure('Test error message')
    );

    expect(log.error).toHaveBeenCalled();
    const mockLog = (log.error as jest.Mock).mock;
    expect(mockLog.calls[0][0]).toEqual('Test error message');
  });

  it('fetchISISInvestigations action applies filters and sort state to request params', async () => {
    const asyncAction = fetchISISInvestigations({
      instrumentId: 1,
      facilityCycleId: 2,
    });
    const getState = (): Partial<StateType> => ({
      dgcommon: {
        ...initialState,
        sort: { column1: 'desc' },
        filters: { column1: '1', column2: '2' },
      },
    });
    await asyncAction(dispatch, getState, null);

    expect(actions[0]).toEqual(fetchInvestigationsRequest(1));

    expect(actions[1]).toEqual(fetchInvestigationsSuccess(mockData, 1));
    const params = new URLSearchParams();
    params.append('order', JSON.stringify('column1 desc'));
    params.append('where', JSON.stringify({ column1: { like: '1' } }));
    params.append('where', JSON.stringify({ column2: { like: '2' } }));

    expect(axios.get).toHaveBeenCalledWith(
      '/instruments/1/facilitycycles/2/investigations',
      expect.objectContaining({
        params,
      })
    );
  });

  it('dispatches fetchInvestigationsRequest and fetchInvestigationsFailure actions upon unsuccessful fetchISISInvestigations action', async () => {
    (axios.get as jest.Mock).mockImplementationOnce(() =>
      Promise.reject({
        message: 'Test error message',
      })
    );

    const asyncAction = fetchISISInvestigations({
      instrumentId: 1,
      facilityCycleId: 2,
    });
    await asyncAction(dispatch, getState, null);

    expect(actions[0]).toEqual(fetchInvestigationsRequest(1));
    expect(actions[1]).toEqual(
      fetchInvestigationsFailure('Test error message')
    );

    expect(log.error).toHaveBeenCalled();
    const mockLog = (log.error as jest.Mock).mock;
    expect(mockLog.calls[0][0]).toEqual('Test error message');
  });

  it('dispatches fetchInvestigationDetailsRequest and fetchInvestigationDetailsSuccess actions upon successful fetchInvestigationDetails action', async () => {
    const mockDetailsData: Investigation[] = [
      {
        ID: 1,
        TITLE: 'Test 1',
        NAME: 'Test 1',
        VISIT_ID: '1',
        RB_NUMBER: '1',
        DOI: 'doi 1',
        SIZE: 1,
        STARTDATE: '2019-06-10',
        ENDDATE: '2019-06-11',
        INVESTIGATIONUSER: [
          {
            ID: 2,
            INVESTIGATION_ID: 1,
            USER_ID: 3,
            ROLE: 'Investigator',
            USER_: {
              ID: 3,
              NAME: 'Louise',
            },
          },
        ],
      },
    ];

    (axios.get as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        data: mockDetailsData,
      })
    );

    const asyncAction = fetchInvestigationDetails(1);
    await asyncAction(dispatch, getState, null);

    expect(actions[0]).toEqual(fetchInvestigationDetailsRequest());
    expect(actions[1]).toEqual(
      fetchInvestigationDetailsSuccess(mockDetailsData)
    );

    const params = new URLSearchParams();
    params.append('where', JSON.stringify({ ID: { eq: 1 } }));
    params.append(
      'include',
      JSON.stringify([{ INVESTIGATIONUSER: 'USER_' }, 'SAMPLE', 'PUBLICATION'])
    );

    expect(axios.get).toHaveBeenCalledWith(
      '/investigations',
      expect.objectContaining({ params })
    );
  });

  it('dispatches fetchInvestigationDetailsRequest and fetchInvestigationDetailsFailure actions upon unsuccessful fetchInvestigationDetails action', async () => {
    (axios.get as jest.Mock).mockImplementationOnce(() =>
      Promise.reject({
        message: 'Test error message',
      })
    );

    const asyncAction = fetchInvestigationDetails(1);
    await asyncAction(dispatch, getState, null);

    expect(actions[0]).toEqual(fetchInvestigationDetailsRequest());
    expect(actions[1]).toEqual(
      fetchInvestigationDetailsFailure('Test error message')
    );

    expect(log.error).toHaveBeenCalled();
    const mockLog = (log.error as jest.Mock).mock;
    expect(mockLog.calls[0][0]).toEqual('Test error message');
  });

  it('dispatches fetchInvestigationCountRequest and fetchInvestigationCountSuccess actions upon successful fetchInvestigationCount action', async () => {
    (axios.get as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        data: 4,
      })
    );

    const asyncAction = fetchInvestigationCount();
    await asyncAction(dispatch, getState, null);

    expect(actions[0]).toEqual(fetchInvestigationCountRequest(1));
    expect(actions[1]).toEqual(fetchInvestigationCountSuccess(4, 1));
  });

  it('fetchInvestigationCount action applies filters to request params, as well as applying optional additional filters', async () => {
    (axios.get as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        data: 7,
      })
    );

    const asyncAction = fetchInvestigationCount([
      {
        filterType: 'distinct',
        filterValue: JSON.stringify(['NAME']),
      },
    ]);

    const getState = (): Partial<StateType> => ({
      dgcommon: {
        ...initialState,
        filters: { column1: '1', column2: '2' },
      },
    });
    await asyncAction(dispatch, getState, null);

    expect(actions[0]).toEqual(fetchInvestigationCountRequest(1));

    expect(actions[1]).toEqual(fetchInvestigationCountSuccess(7, 1));

    const params = new URLSearchParams();
    params.append('where', JSON.stringify({ column1: { like: '1' } }));
    params.append('where', JSON.stringify({ column2: { like: '2' } }));
    params.append('distinct', JSON.stringify(['NAME']));

    expect(axios.get).toHaveBeenCalledWith(
      '/investigations/count',
      expect.objectContaining({
        params,
      })
    );
  });

  it('dispatches fetchInvestigationCountRequest and fetchInvestigationCountFailure actions upon unsuccessful fetchInvestigationCount action', async () => {
    (axios.get as jest.Mock).mockImplementationOnce(() =>
      Promise.reject({
        message: 'Test error message',
      })
    );

    const asyncAction = fetchInvestigationCount();
    await asyncAction(dispatch, getState, null);

    expect(actions[0]).toEqual(fetchInvestigationCountRequest(1));
    expect(actions[1]).toEqual(
      fetchInvestigationCountFailure('Test error message')
    );

    expect(log.error).toHaveBeenCalled();
    const mockLog = (log.error as jest.Mock).mock;
    expect(mockLog.calls[0][0]).toEqual('Test error message');
  });

  it('dispatches fetchInvestigationCountRequest and fetchInvestigationCountSuccess actions upon successful fetchISISInvestigationCount action', async () => {
    (axios.get as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        data: 4,
      })
    );

    const asyncAction = fetchISISInvestigationCount(1, 2);
    await asyncAction(dispatch, getState, null);

    expect(actions[0]).toEqual(fetchInvestigationCountRequest(1));
    expect(actions[1]).toEqual(fetchInvestigationCountSuccess(4, 1));
  });

  it('fetchISISInvestigationCount action applies filters to request params', async () => {
    (axios.get as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        data: 7,
      })
    );

    const asyncAction = fetchISISInvestigationCount(1, 2);

    const getState = (): Partial<StateType> => ({
      dgcommon: {
        ...initialState,
        filters: { column1: '1', column2: '2' },
      },
    });
    await asyncAction(dispatch, getState, null);

    expect(actions[0]).toEqual(fetchInvestigationCountRequest(1));

    expect(actions[1]).toEqual(fetchInvestigationCountSuccess(7, 1));

    const params = new URLSearchParams();
    params.append('where', JSON.stringify({ column1: { like: '1' } }));
    params.append('where', JSON.stringify({ column2: { like: '2' } }));

    expect(axios.get).toHaveBeenCalledWith(
      '/instruments/1/facilitycycles/2/investigations/count',
      expect.objectContaining({
        params,
      })
    );
  });

  it('dispatches fetchInvestigationCountRequest and fetchInvestigationCountFailure actions upon unsuccessful fetchISISInvestigationCount action', async () => {
    (axios.get as jest.Mock).mockImplementationOnce(() =>
      Promise.reject({
        message: 'Test error message',
      })
    );

    const asyncAction = fetchISISInvestigationCount(1, 2);
    await asyncAction(dispatch, getState, null);

    expect(actions[0]).toEqual(fetchInvestigationCountRequest(1));
    expect(actions[1]).toEqual(
      fetchInvestigationCountFailure('Test error message')
    );

    expect(log.error).toHaveBeenCalled();
    const mockLog = (log.error as jest.Mock).mock;
    expect(mockLog.calls[0][0]).toEqual('Test error message');
  });
});
