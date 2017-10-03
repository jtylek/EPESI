/*
 * @author Paul Bukowski <pbukowski@telaxus.com>
 * @version 1.0
 * @copyright Copyright &copy; 2007, Telaxus LLC
 * @licence MIT
 */

import Loader from './loader';
import axios from 'axios';
import qs from 'qs';
import ConfirmLeave from './confirmLeave';

class Epesi {
    loader = new Loader();
    confirmLeave = new ConfirmLeave();
    default_indicator = 'loading...';
    procOn = 0;
    client_id = 0;
    process_file = 'process.php';
    indicator = 'epesiStatus';
    indicator_text = 'epesiStatusText';


    updateIndicator = () => {
        document.getElementById(this.indicator).style.display = this.procOn ? '' : 'none';
        if (!this.procOn) document.getElementById('main_content').style.display = '';
    };

    updateIndicatorText = (text) => {
        document.getElementById(this.indicator_text).innerHTML = text;
        document.getElementById(this.indicator_text).innerHTML = text;
    };

    history_add = (id) => {
        window.history.pushState({history_id: id}, '');
    };

    init = (cl_id, path, params) => {
        this.client_id=cl_id;
        this.process_file=path;

        axios.defaults.headers.common['X-Client-ID'] = cl_id;

        jQuery(document).ajaxSend((ev, xhr, settings) => {
            xhr.setRequestHeader('X-Client-ID', this.client_id);
        });

        this.history_add(0);
        if(typeof params == 'undefined')
            params = '';
        this.request(params,0);

        window.addEventListener('popstate', ({state: {history_id}}) => this.request('', history_id));
    };

    request = async (url, history) => {
        this.procOn++;
        this.updateIndicator();

        let keep_focus_field = null;
        if (document.activeElement) keep_focus_field = document.activeElement.getAttribute('id');

        try {
            let response = await axios.post(this.process_file, qs.stringify({history, url}));
            jQuery(document).trigger('e:loading');
            await this.loader.execute_js(response.data);
        } catch (err) {
            this.text(err.message, 'error_box', 'p')
        }

        this.procOn--;
        this.updateIndicator();
        this.append_js("jQuery(document).trigger('e:load')");
        if (keep_focus_field !== null) {
            let element = document.getElementById(keep_focus_field);
            if(element) element.focus();
        }
    };

    href = (url, indicator, mode, disableConfirmLeave = false) => {
        if (!disableConfirmLeave && !this.confirmLeave.check()) return;
        if(this.procOn === 0 || mode === 'allow'){
            !indicator ? this.updateIndicatorText(this.default_indicator) : this.updateIndicatorText(indicator);
            this.request(url);
        } else if(mode === 'queue') {
            setTimeout(() => this.href(url, indicator, mode), 500);
        }
    }

    submit_form = (formName, modulePath, indicator) => {
        this.confirmLeave.freeze(formName);
        let form = document.querySelector(`form[name="${formName}"]`);
        let submited = form.querySelector(`input[name="submited"]`);


        submited.value = 1;

        let formData = new FormData(form);
        let url = qs.stringify(Object.assign(formData.getAll(), {'__action_module__': encodeURIComponent(modulePath)}));
        _chj(url, indicator, '');

        submited.value = 0;
    };

    text = (html, element_id, type = 'i') => {
        let element = document.getElementById(element_id);
        if(!element) return;

        switch (type) {
            case 'i':
                element.innerHTML = html;
                break;
            case 'p':
                element.insertAdjacentHTML('afterbegin', html);
                break;
            case 'a':
                element.insertAdjacentHTML('beforeend', html);
                break;
        }
    };

    load_js = file => {
        this.loader.load_js(file);
    };

    append_js = texti => {
        this.loader.execute_js(texti);
    };

    append_js_script = texti => {
        console.warn('DEPRECATED: use Loader.execute_js instead');
        Loader.insertScript(texti);
    };

    js_loader = () => {
        console.warn('DEPRECATED: load is invoked implicitly');
        this.loader.load();
    };

    load_css =file => {
        this.loader.load_css(file);
    }
}

export default Epesi;