import * as vscode from 'vscode';
import { Term } from 'rdf-js';

const rdfVocabularies = require('@zazuko/rdf-vocabularies');
const { expand, shrink } = rdfVocabularies;

const isA = expand('rdf:type');
const comment = expand('rdfs:comment');

interface CompletionsIndex {
	[key:string]: {
		iri: string,
		description: string
	};
}

export async function activate(context: vscode.ExtensionContext) {
	const datasets = await rdfVocabularies();

	// suggest values for a given prefix:
	// show suggestions as soon as `prefix:` is typed: `rdfs:` -> ['rdfs:Class', …]
	for (const [prefix, dataset] of Object.entries(datasets)) {
		const completionsIndex: CompletionsIndex = {};
		dataset
			// @ts-ignore
			.match(null, isA)
			.forEach(({ subject }: { subject: Term }) => {
				const shrinked: string = shrink(subject.value);
				if (shrinked && !shrinked.endsWith(':')) {
					const description = dataset
						// @ts-ignore
						.match(subject, comment)
						.toArray()[0];

					completionsIndex[shrinked] = {
						iri: subject.value,
						description: description ? description.object.value : ''
					};
				}
			});

		const prefixedValuesList = Object.entries(completionsIndex)
			.map(([key, object]) => {
				const completionItem = new vscode.CompletionItem(key);
				completionItem.documentation = new vscode.MarkdownString(`[${object.description || object.iri}](${object.iri})`);
				return completionItem;
			});

		const completionProvider = vscode.languages.registerCompletionItemProvider(
			'*',
			{
				provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken) {
					return prefixedValuesList;
				}
			},
			`${prefix}:`
		);
		context.subscriptions.push(completionProvider);
	}
}

// this method is called when your extension is deactivated
export function deactivate() {}
