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
					uniquePrefixedValues.add(new vscode.CompletionItem(shrinked));
				}
			});
			const prefixedValuesList = Array.from(uniquePrefixedValues.values());

			context.subscriptions.push(vscode.languages.registerCompletionItemProvider('*', {
				provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken) {
					return prefixedValuesList;
				}
			}, `${prefix}:`));
		}

	// suggest prefixes: add suggestions for all prefixes: `r` -> ['rdf:', 'rdfs:', …]
	const prefixes = Object.keys(datasets).map((prefix) => new vscode.CompletionItem(`${prefix}:`));
	context.subscriptions.push(vscode.languages.registerCompletionItemProvider('*', {
		provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken) {
			return prefixes;
		}
	}));
}

// this method is called when your extension is deactivated
export function deactivate() {}
