import React from 'react';
import { createShallow, createMount } from '@material-ui/core/test-utils';
import ISISDatafilesTable from './isisDatafilesTable.component';
import { initialState as dgDataViewInitialState } from '../../../state/reducers/dgdataview.reducer';
import configureStore from 'redux-mock-store';
import { StateType } from '../../../state/app.types';
import {
  fetchDatafilesRequest,
  filterTable,
  sortTable,
  downloadDatafileRequest,
  fetchDatafileDetailsRequest,
  fetchDatafileCountRequest,
  removeFromCartRequest,
  addToCartRequest,
  dGCommonInitialState,
  fetchAllIdsRequest,
} from 'datagateway-common';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import { Table, Datafile } from 'datagateway-common';
import { MemoryRouter } from 'react-router';
import axios from 'axios';

describe('ISIS datafiles table component', () => {
  let shallow;
  let mount;
  let mockStore;
  let state: StateType;

  beforeEach(() => {
    shallow = createShallow({ untilSelector: 'ISISDatafilesTable' });
    mount = createMount();

    mockStore = configureStore([thunk]);
    state = JSON.parse(
      JSON.stringify({
        dgdataview: dgDataViewInitialState,
        dgcommon: dGCommonInitialState,
      })
    );
    state.dgcommon.data = [
      {
        ID: 1,
        NAME: 'Test 1',
        LOCATION: '/test1',
        FILESIZE: 1,
        MOD_TIME: '2019-07-23',
        CREATE_TIME: '2019-07-23',
        DATASET_ID: 1,
      },
    ];
    state.dgcommon.allIds = [1];

    (axios.get as jest.Mock).mockImplementation(() =>
      Promise.resolve({ data: [] })
    );
    (axios.post as jest.Mock).mockImplementation(() =>
      Promise.resolve({ data: {} })
    );
    (axios.delete as jest.Mock).mockImplementation(() =>
      Promise.resolve({ data: {} })
    );
    global.Date.now = jest.fn(() => 1);
  });

  afterEach(() => {
    mount.cleanUp();
  });

  it('renders correctly', () => {
    const wrapper = shallow(
      <ISISDatafilesTable store={mockStore(state)} datasetId="1" />
    );
    expect(wrapper).toMatchSnapshot();
  });

  it('sends fetchDatafileCount and fetchDatafiles actions when watched store values change', () => {
    let testStore = mockStore(state);
    const wrapper = mount(
      <Provider store={testStore}>
        <MemoryRouter>
          <ISISDatafilesTable datasetId="1" />
        </MemoryRouter>
      </Provider>
    );

    // simulate clearTable action
    testStore = mockStore({
      ...state,
      dgdataview: { ...state.dgdataview, sort: {}, filters: {} },
    });
    wrapper.setProps({ store: testStore });

    expect(testStore.getActions()[0]).toEqual(fetchDatafileCountRequest(1));
    expect(testStore.getActions()[1]).toEqual(fetchAllIdsRequest(1));
    expect(testStore.getActions()[2]).toEqual(fetchDatafilesRequest(1));
  });

  it('sends fetchDatafiles action when loadMoreRows is called', () => {
    const testStore = mockStore(state);
    const wrapper = shallow(
      <ISISDatafilesTable datasetId="1" store={testStore} />
    );

    wrapper.prop('loadMoreRows')({ startIndex: 50, stopIndex: 74 });

    expect(testStore.getActions()[0]).toEqual(fetchDatafilesRequest(1));
  });

  it('sends filterTable action on text filter', () => {
    const testStore = mockStore(state);
    const wrapper = mount(
      <Provider store={testStore}>
        <MemoryRouter>
          <ISISDatafilesTable datasetId="1" />
        </MemoryRouter>
      </Provider>
    );

    const filterInput = wrapper
      .find('[aria-label="Filter by datafiles.name"] input')
      .first();
    filterInput.instance().value = 'test';
    filterInput.simulate('change');

    expect(testStore.getActions()[3]).toEqual(
      filterTable('NAME', { value: 'test', type: 'include' })
    );

    filterInput.instance().value = '';
    filterInput.simulate('change');

    expect(testStore.getActions()[5]).toEqual(filterTable('NAME', null));
  });

  it('sends filterTable action on date filter', () => {
    const testStore = mockStore(state);
    const wrapper = mount(
      <Provider store={testStore}>
        <MemoryRouter>
          <ISISDatafilesTable datasetId="1" />
        </MemoryRouter>
      </Provider>
    );

    const filterInput = wrapper.find(
      '[aria-label="datafiles.modified_time date filter to"]'
    );
    filterInput.instance().value = '2019-08-06';
    filterInput.simulate('change');

    expect(testStore.getActions()[3]).toEqual(
      filterTable('MOD_TIME', { endDate: '2019-08-06' })
    );

    filterInput.instance().value = '';
    filterInput.simulate('change');

    expect(testStore.getActions()[5]).toEqual(filterTable('MOD_TIME', null));
  });

  it('sends sortTable action on sort', () => {
    const testStore = mockStore(state);
    const wrapper = mount(
      <Provider store={testStore}>
        <MemoryRouter>
          <ISISDatafilesTable datasetId="1" />
        </MemoryRouter>
      </Provider>
    );

    wrapper
      .find('[role="columnheader"] span[role="button"]')
      .first()
      .simulate('click');

    expect(testStore.getActions()[3]).toEqual(sortTable('NAME', 'asc'));
  });

  it('sends addToCart action on unchecked checkbox click', () => {
    const testStore = mockStore(state);
    const wrapper = mount(
      <Provider store={testStore}>
        <MemoryRouter>
          <ISISDatafilesTable datasetId="1" />
        </MemoryRouter>
      </Provider>
    );

    wrapper.find('[aria-label="select row 0"]').first().simulate('click');

    expect(testStore.getActions()[3]).toEqual(addToCartRequest());
  });

  it('sends removeFromCart action on checked checkbox click', () => {
    state.dgcommon.cartItems = [
      {
        entityId: 1,
        entityType: 'datafile',
        id: 1,
        name: 'test',
        parentEntities: [],
      },
    ];

    const testStore = mockStore(state);
    const wrapper = mount(
      <Provider store={testStore}>
        <MemoryRouter>
          <ISISDatafilesTable datasetId="1" />
        </MemoryRouter>
      </Provider>
    );

    wrapper.find('[aria-label="select row 0"]').first().simulate('click');

    expect(testStore.getActions()[3]).toEqual(removeFromCartRequest());
  });

  it('selected rows only considers relevant cart items', () => {
    state.dgcommon.cartItems = [
      {
        entityId: 1,
        entityType: 'dataset',
        id: 1,
        name: 'test',
        parentEntities: [],
      },
      {
        entityId: 2,
        entityType: 'datafile',
        id: 2,
        name: 'test',
        parentEntities: [],
      },
    ];

    const testStore = mockStore(state);
    const wrapper = mount(
      <Provider store={testStore}>
        <MemoryRouter>
          <ISISDatafilesTable datasetId="1" />
        </MemoryRouter>
      </Provider>
    );

    const selectAllCheckbox = wrapper
      .find('[aria-label="select all rows"]')
      .first();

    expect(selectAllCheckbox.prop('checked')).toEqual(false);
    expect(selectAllCheckbox.prop('data-indeterminate')).toEqual(false);
  });

  it('sends downloadData action on click of download button', () => {
    const testStore = mockStore(state);
    const wrapper = mount(
      <Provider store={testStore}>
        <MemoryRouter>
          <ISISDatafilesTable datasetId="1" />
        </MemoryRouter>
      </Provider>
    );

    wrapper.find('button[aria-label="datafiles.download"]').simulate('click');

    expect(testStore.getActions()[3]).toEqual(downloadDatafileRequest(1));
  });

  it("doesn't display download button for datafiles with no location", () => {
    const datafile = state.dgcommon.data[0] as Datafile;
    const { LOCATION, ...datafileWithoutLocation } = datafile;
    state.dgcommon.data = [datafileWithoutLocation];

    const testStore = mockStore(state);
    const wrapper = mount(
      <Provider store={testStore}>
        <MemoryRouter>
          <ISISDatafilesTable datasetId="1" />
        </MemoryRouter>
      </Provider>
    );

    expect(
      wrapper.find('button[aria-label="datafiles.download"]')
    ).toHaveLength(0);
  });

  it('renders details panel correctly and it sends off an FetchDatasetDetails action', () => {
    const testStore = mockStore(state);
    const wrapper = mount(
      <Provider store={testStore}>
        <MemoryRouter>
          <ISISDatafilesTable datasetId="1" />
        </MemoryRouter>
      </Provider>
    );

    const detailsPanelWrapper = shallow(
      wrapper.find(Table).prop('detailsPanel')({
        rowData: state.dgcommon.data[0],
      })
    );
    expect(detailsPanelWrapper).toMatchSnapshot();

    mount(
      wrapper.find(Table).prop('detailsPanel')({
        rowData: state.dgcommon.data[0],
        detailsPanelResize: jest.fn(),
      })
    );

    expect(testStore.getActions()[3]).toEqual(fetchDatafileDetailsRequest());
  });

  it('renders file size as bytes', () => {
    const wrapper = mount(
      <Provider store={mockStore(state)}>
        <MemoryRouter>
          <ISISDatafilesTable datasetId="1" />
        </MemoryRouter>
      </Provider>
    );

    expect(wrapper.find('[aria-colindex=5]').find('p').text()).toEqual('1 B');
  });
});
