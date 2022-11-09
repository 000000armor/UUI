import * as React from 'react';
import { EditableDocContent, DocExample, BaseDocsBlock } from '../../common';

export class FiltersPanelDoc extends BaseDocsBlock {
    title = 'Filters Panel';


    renderContent() {
        return (
            <>
                <EditableDocContent fileName='filters-panel-descriptions' />
                { this.renderSectionTitle('Examples') }
                <DocExample
                    title='Filters Panel'
                    path='./examples/tables/FiltersPanelBasic.example.tsx'
                />
            </>
        );
    }
}