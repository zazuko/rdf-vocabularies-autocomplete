import * as vscode from 'vscode';
import { Term } from 'rdf-js';

const rdfVocabularies = require('@zazuko/rdf-vocabularies');
const { expand, shrink } = rdfVocabularies;
const isA = expand('rdf:type');

export async function activate(context: vscode.ExtensionContext) {
	const datasets = await rdfVocabularies();

	// suggest values for a given prefix:
	// show suggestions as soon as `prefix:` is typed: `rdfs:` -> ['rdfs:Class', …]
	for (const [prefix, dataset] of Object.entries(datasets)) {
		const uniquePrefixedValues = new Set();
		dataset
			// @ts-ignore
			.match(null, isA)
			.forEach(({ subject }: { subject: Term }) => {
				const shrinked = shrink(subject.value);
				if (shrinked && !shrinked.endsWith(':')) {
					uniquePrefixedValues.add(shrinked);
				}
			});

		const prefixedValuesList = Array.from(uniquePrefixedValues.values())
			.map((val) => {
				const completionItem = new vscode.CompletionItem(val);
				completionItem.documentation = expand(val);
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
