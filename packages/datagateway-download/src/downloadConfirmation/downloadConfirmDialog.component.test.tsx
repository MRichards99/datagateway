import React from 'react';
import { createMount } from '@material-ui/core/test-utils';
import DownloadConfirmDialog from './downloadConfirmDialog.component';
import { ReactWrapper } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { flushPromises } from '../setupTests';

import axios from 'axios';
import { MenuItem } from '@material-ui/core';

describe('DownloadConfirmDialog', () => {
  let mount;

  beforeAll(() => {
    // Fix the time to 2020-1-1 1hr:1min:1sec in order to match
    // snapshots for the DownloadConfirmDialog component.
    const fixedDate = new Date(2020, 0, 1, 1, 1, 1);
    const d = Date;

    const _global: NodeJS.Global = global;
    _global.Date = jest.fn(() => fixedDate);
    _global.Date.parse = d.parse;
    _global.Date.UTC = d.UTC;
    _global.Date.now = d.now;
  });

  beforeEach(() => {
    mount = createMount();
  });

  afterEach(() => {
    mount.cleanUp();
  });

  afterAll(() => {
    global.Date = Date;
  });

  const createWrapper = (
    size: number,
    isTwoLevel: boolean,
    open: boolean
  ): ReactWrapper => {
    return mount(
      <DownloadConfirmDialog
        totalSize={size}
        isTwoLevel={isTwoLevel}
        setOpen={open}
        setClose={jest.fn()}
      />
    );
  };

  it('renders correctly', () => {
    // Pass in a size of 100 bytes and for the dialog to be open when mounted.
    const wrapper = createWrapper(100, false, true);

    expect(wrapper).toMatchSnapshot();
  });

  it('does not load the download speed/time table when isTwoLevel is true', () => {
    // Set isTwoLevel to true as a prop.
    const wrapper = createWrapper(100, true, true);

    expect(wrapper).toMatchSnapshot();
  });

  it('loads the submit successful view when download button is clicked', async () => {
    const wrapper = createWrapper(100, false, true);

    (axios.post as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        data: {
          facilityName: 'LILS',
          userName: 'test user',
          cartItems: [],
          downloadId: '1',
        },
      })
    );

    (axios.get as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        data: [
          {
            createdAt: '2020-01-01T01:01:01Z',
            downloadItems: [
              {
                entityId: 1,
                entityType: 'investigation',
                id: 1,
              },
            ],
            facilityName: 'LILS',
            fileName: 'LILS_2020-1-1_1-1-1',
            fullName: 'simple/root',
            id: 1,
            isDeleted: false,
            isEmailSent: false,
            isTwoLevel: false,
            preparedId: 'test-id',
            sessionId: '',
            size: 0,
            status: 'COMPLETE',
            transport: 'https',
            userName: 'simple/root',
          },
        ],
      })
    );

    // Ensure the close button is present.
    expect(wrapper.exists('button#download-confirmation-download')).toBe(true);

    await act(async () => {
      wrapper.find('button#download-confirmation-download').simulate('click');
      await flushPromises();
      wrapper.update();
    });

    // The success message should exist.
    expect(wrapper.exists('#download-confirmation-success')).toBe(true);
  });

  it('successfully loads submit successful view after submitting download request with custom values', async () => {
    const wrapper = createWrapper(100, false, true);

    (axios.post as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        data: {
          facilityName: 'LILS',
          userName: 'test user',
          cartItems: [],
          downloadId: '1',
        },
      })
    );

    // Fill in the custom download name, access method and email address.
    expect(wrapper.exists('input#confirm-download-name')).toBe(true);
    const downloadName = wrapper.find('input#confirm-download-name');
    downloadName.instance().value = 'test-name';
    downloadName.simulate('change');

    // Change the value of the dropdown access method list.
    expect(wrapper.exists('[role="button"]#confirm-access-method')).toBe(true);
    wrapper.find('[role="button"]#confirm-access-method').simulate('click');
    wrapper
      .find(MenuItem)
      .at(1)
      .simulate('click');

    expect(wrapper.exists('input#confirm-download-email')).toBe(true);
    const emailAddress = wrapper.find('input#confirm-download-email');
    emailAddress.instance().value = 'test@email.com';
    emailAddress.simulate('change');

    // Ensure the close button is present.
    expect(wrapper.exists('button#download-confirmation-download')).toBe(true);

    await act(async () => {
      wrapper.find('button#download-confirmation-download').simulate('click');
      await flushPromises();
      wrapper.update();
    });

    expect(wrapper.exists('#download-confirmation-success')).toBe(true);
  });

  it('prevents the submission of a download request with an invalid email', async () => {
    const wrapper = createWrapper(100, false, true);

    // Ensure the download button is present.
    expect(wrapper.exists('button#download-confirmation-download')).toBe(true);

    // Simulate incorrect email address entry.
    await act(async () => {
      expect(
        wrapper.find('input#confirm-download-email').prop('disabled')
      ).toBeFalsy();

      wrapper
        .find('input#confirm-download-email')
        .simulate('change', { target: { value: 'test@' } });

      await flushPromises();
      wrapper.update();
    });

    expect(
      wrapper.find('button#download-confirmation-download').props().disabled
    ).toBe(true);

    // Simulate correct email address entry.
    await act(async () => {
      wrapper
        .find('input#confirm-download-email')
        .simulate('change', { target: { value: 'test@test.com' } });

      await flushPromises();
      wrapper.update();
    });

    expect(
      wrapper.find('button#download-confirmation-download').props().disabled
    ).toBe(false);

    // Simulate removing an email address completely,
    // thus, emptying the text field.
    await act(async () => {
      wrapper
        .find('input#confirm-download-email')
        .simulate('change', { target: { value: '' } });

      await flushPromises();
      wrapper.update();
    });

    expect(
      wrapper.find('button#download-confirmation-download').props().disabled
    ).toBe(false);
    expect(
      wrapper.find('input#confirm-download-email').instance().value
    ).toEqual('');
  });

  it('loads the submit unsuccessful view when download button is clicked', async () => {
    const wrapper = createWrapper(100, false, true);

    // We omit the downloadId which will cause the unsuccessful view to be shown.
    (axios.post as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        data: {
          facilityName: 'LILS',
          userName: 'test user',
          cartItems: [],
        },
      })
    );

    // Ensure the download button is present.
    expect(wrapper.exists('button#download-confirmation-download')).toBe(true);

    await act(async () => {
      wrapper.find('button#download-confirmation-download').simulate('click');
      await flushPromises();
      wrapper.update();
    });

    expect(wrapper.exists('#download-confirmation-unsuccessful')).toBe(true);
  });

  it('closes the Download Confirmation Dialog and successfully calls the setClose function', () => {
    const wrapper = createWrapper(1, false, true);

    // Ensure the close button is present.
    expect(wrapper.exists('[aria-label="download-confirmation-close"]')).toBe(
      true
    );
  });
});

describe('renders the estimated download speed/time table with varying values', () => {
  let timeMount;

  const timeWrapper = (size: number): ReactWrapper => {
    return timeMount(
      <DownloadConfirmDialog
        totalSize={size}
        isTwoLevel={false}
        setOpen={true}
        setClose={jest.fn()}
      />
    );
  };

  beforeEach(() => {
    timeMount = createMount();
  });

  afterEach(() => {
    timeMount.cleanUp();
  });

  // Calculate the file size required to reach the given download time (at 1 Mbps).
  const timeToSize = (
    seconds: number,
    minutes?: number,
    hours?: number,
    days?: number
  ): number => {
    // NOTE: For these tests to make it simple we use 1 Mbps for this.
    let downloadSpeed = 1; // Mbps

    // Get the all the time in seconds.
    let inSeconds =
      (days ? days * 86400 : 0) +
      (hours ? hours * 3600 : 0) +
      (minutes ? minutes * 60 : 0) +
      seconds;

    // Calculate final file size required (in bytes).
    let fileSize = inSeconds * (downloadSpeed / 8) * (1024 * 1024);

    return fileSize;
  };

  it('renders for multiple days, hours, minutes and seconds', () => {
    // Test for 2 seconds, 2 minutes, 2 hours and 2 days.
    const wrapper = timeWrapper(timeToSize(2, 2, 2, 2));

    expect(wrapper.exists('[aria-label="download-table"]')).toBe(true);
  });

  it('renders for a single day, hour, minute and second', () => {
    const wrapper = timeWrapper(timeToSize(1, 1, 1, 1));

    expect(wrapper.exists('[aria-label="download-table"]')).toBe(true);
  });

  describe('estimated download table renders for single time measurements', () => {
    it('renders for a single day', () => {
      const wrapper = timeWrapper(timeToSize(0, 0, 0, 1));

      expect(wrapper.exists('[aria-label="download-table"]')).toBe(true);
    });

    it('renders for a single hour', () => {
      const wrapper = timeWrapper(timeToSize(0, 0, 1, 0));

      expect(wrapper.exists('[aria-label="download-table"]')).toBe(true);
    });

    it('renders for a single minute', () => {
      const wrapper = timeWrapper(timeToSize(0, 1, 0, 0));

      expect(wrapper.exists('[aria-label="download-table"]')).toBe(true);
    });

    it('renders for a single second', () => {
      const wrapper = timeWrapper(timeToSize(1, 0, 0, 0));

      expect(wrapper.exists('[aria-label="download-table"]')).toBe(true);
    });
  });
});
